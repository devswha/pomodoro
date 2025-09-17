-- =====================================================================================
-- Performance Optimization for Pomodoro Timer Database
-- Advanced indexing, query optimization, and caching strategies
-- =====================================================================================

-- =====================================================================================
-- ADVANCED INDEXING STRATEGIES
-- =====================================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_status_date ON public.pomodoro_sessions(user_id, status, DATE(start_time));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_active_start ON public.pomodoro_sessions(user_id, is_active, start_time) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_user_status_date ON public.meetings(user_id, status, meeting_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_user_expires ON public.auth_sessions(user_id, expires_at) WHERE is_active = TRUE;

-- Partial indexes for frequently filtered data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_active ON public.pomodoro_sessions(user_id, start_time) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_completed ON public.pomodoro_sessions(user_id, start_time) WHERE status = 'completed';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_upcoming ON public.meetings(user_id, meeting_date, meeting_time) WHERE status = 'scheduled' AND meeting_date >= CURRENT_DATE;

-- Full-text search indexes for content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_text_search ON public.pomodoro_sessions USING gin(to_tsvector('english', title || ' ' || goal || ' ' || tags));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_text_search ON public.meetings USING gin(to_tsvector('english', title || ' ' || description || ' ' || agenda));

-- JSON indexes for aggregated statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_daily_stats ON public.user_stats USING gin(daily_stats);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_monthly_stats ON public.user_stats USING gin(monthly_stats);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_tags ON public.user_stats USING gin(tags);

-- =====================================================================================
-- MATERIALIZED VIEWS FOR HEAVY QUERIES
-- =====================================================================================

-- Materialized view for user activity summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
    u.id as user_id,
    u.username,
    us.total_sessions,
    us.completed_sessions,
    us.completion_rate,
    us.streak_days,
    us.longest_streak,
    us.total_minutes,
    us.completed_minutes,
    us.average_session_length,
    us.last_session_date,
    -- Recent activity (last 30 days)
    COALESCE(recent.recent_sessions, 0) as recent_sessions,
    COALESCE(recent.recent_completed, 0) as recent_completed,
    COALESCE(recent.recent_minutes, 0) as recent_minutes,
    -- This week activity
    COALESCE(weekly.weekly_sessions, 0) as weekly_sessions,
    COALESCE(weekly.weekly_completed, 0) as weekly_completed,
    COALESCE(weekly.weekly_minutes, 0) as weekly_minutes,
    -- Ranking
    RANK() OVER (ORDER BY us.completed_sessions DESC) as session_rank,
    RANK() OVER (ORDER BY us.completed_minutes DESC) as minute_rank,
    RANK() OVER (ORDER BY us.streak_days DESC) as streak_rank,
    us.updated_at
FROM public.users u
JOIN public.user_stats us ON u.id = us.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as recent_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') as recent_completed,
        SUM(duration) FILTER (WHERE status = 'completed') as recent_minutes
    FROM public.pomodoro_sessions 
    WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
) recent ON u.id = recent.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as weekly_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') as weekly_completed,
        SUM(duration) FILTER (WHERE status = 'completed') as weekly_minutes
    FROM public.pomodoro_sessions 
    WHERE start_time >= DATE_TRUNC('week', CURRENT_DATE)
    GROUP BY user_id
) weekly ON u.id = weekly.user_id;

-- Create indexes on materialized view
CREATE INDEX idx_user_activity_summary_user_id ON user_activity_summary(user_id);
CREATE INDEX idx_user_activity_summary_session_rank ON user_activity_summary(session_rank);
CREATE INDEX idx_user_activity_summary_minute_rank ON user_activity_summary(minute_rank);
CREATE INDEX idx_user_activity_summary_streak_rank ON user_activity_summary(streak_rank);

-- Materialized view for daily statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_statistics AS
SELECT 
    DATE(start_time) as session_date,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
    COUNT(DISTINCT user_id) as active_users,
    SUM(duration) as total_minutes,
    SUM(duration) FILTER (WHERE status = 'completed') as completed_minutes,
    AVG(duration) as avg_session_length,
    -- Popular tags for the day
    (
        SELECT string_agg(tag_name, ', ' ORDER BY tag_count DESC)
        FROM (
            SELECT 
                TRIM(tag_item) as tag_name,
                COUNT(*) as tag_count
            FROM public.pomodoro_sessions,
                 LATERAL string_to_table(tags, ',') as tag_item
            WHERE DATE(start_time) = DATE(ps.start_time)
              AND tags IS NOT NULL 
              AND tags != ''
              AND TRIM(tag_item) != ''
            GROUP BY TRIM(tag_item)
            ORDER BY COUNT(*) DESC
            LIMIT 5
        ) top_tags
    ) as popular_tags
FROM public.pomodoro_sessions ps
WHERE start_time >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(start_time)
ORDER BY session_date DESC;

CREATE INDEX idx_daily_statistics_date ON daily_statistics(session_date);

-- =====================================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- =====================================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TEXT AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_statistics;
    
    RETURN 'Materialized views refreshed successfully at ' || NOW()::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule materialized view refresh (to be called by cron)
CREATE OR REPLACE FUNCTION scheduled_refresh_views()
RETURNS VOID AS $$
BEGIN
    -- Refresh views during low-traffic hours
    IF EXTRACT(hour FROM NOW()) BETWEEN 2 AND 6 THEN
        PERFORM refresh_materialized_views();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- OPTIMIZED QUERY FUNCTIONS
-- =====================================================================================

-- Optimized function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE(
    user_info JSONB,
    current_stats JSONB,
    active_session JSONB,
    recent_sessions JSONB,
    upcoming_meetings JSONB,
    weekly_progress JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT 
            jsonb_build_object(
                'id', u.id,
                'username', u.username,
                'displayName', u.display_name,
                'email', u.email,
                'avatar', u.avatar,
                'preferences', row_to_json(up.*)
            ) as user_info
        FROM public.users u
        LEFT JOIN public.user_preferences up ON u.id = up.user_id
        WHERE u.id = p_user_id
    ),
    stats_data AS (
        SELECT 
            jsonb_build_object(
                'totalSessions', us.total_sessions,
                'completedSessions', us.completed_sessions,
                'completionRate', us.completion_rate,
                'streakDays', us.streak_days,
                'longestStreak', us.longest_streak,
                'totalMinutes', us.total_minutes,
                'completedMinutes', us.completed_minutes,
                'averageSessionLength', us.average_session_length,
                'lastSessionDate', us.last_session_date
            ) as current_stats
        FROM public.user_stats us
        WHERE us.user_id = p_user_id
    ),
    active_session_data AS (
        SELECT 
            COALESCE(
                jsonb_build_object(
                    'id', ps.id,
                    'title', ps.title,
                    'duration', ps.duration,
                    'startTime', ps.start_time,
                    'endTime', ps.end_time,
                    'status', ps.status
                ),
                'null'::jsonb
            ) as active_session
        FROM public.pomodoro_sessions ps
        WHERE ps.user_id = p_user_id AND ps.is_active = TRUE
        LIMIT 1
    ),
    recent_sessions_data AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', ps.id,
                    'title', ps.title,
                    'duration', ps.duration,
                    'status', ps.status,
                    'startTime', ps.start_time
                ) ORDER BY ps.start_time DESC
            ) as recent_sessions
        FROM (
            SELECT * FROM public.pomodoro_sessions 
            WHERE user_id = p_user_id 
            ORDER BY start_time DESC 
            LIMIT 10
        ) ps
    ),
    upcoming_meetings_data AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'title', m.title,
                    'date', m.meeting_date,
                    'time', m.meeting_time,
                    'duration', m.duration
                ) ORDER BY m.meeting_date, m.meeting_time
            ) as upcoming_meetings
        FROM (
            SELECT * FROM public.meetings 
            WHERE user_id = p_user_id 
              AND meeting_date >= CURRENT_DATE
              AND status = 'scheduled'
            ORDER BY meeting_date, meeting_time
            LIMIT 5
        ) m
    ),
    weekly_progress_data AS (
        SELECT 
            jsonb_build_object(
                'weeklyGoal', up.weekly_goal,
                'thisWeekMinutes', COALESCE(SUM(ps.duration) FILTER (WHERE ps.status = 'completed'), 0),
                'thisWeekSessions', COUNT(ps.*) FILTER (WHERE ps.status = 'completed'),
                'progressPercentage', 
                    CASE 
                        WHEN up.weekly_goal > 0 THEN 
                            LEAST(100, ROUND((COALESCE(SUM(ps.duration) FILTER (WHERE ps.status = 'completed'), 0) * 100.0 / up.weekly_goal), 1))
                        ELSE 0 
                    END
            ) as weekly_progress
        FROM public.user_preferences up
        LEFT JOIN public.pomodoro_sessions ps ON up.user_id = ps.user_id 
            AND ps.start_time >= DATE_TRUNC('week', CURRENT_DATE)
        WHERE up.user_id = p_user_id
        GROUP BY up.weekly_goal
    )
    SELECT 
        ud.user_info,
        sd.current_stats,
        asd.active_session,
        rsd.recent_sessions,
        umd.upcoming_meetings,
        wpd.weekly_progress
    FROM user_data ud
    CROSS JOIN stats_data sd
    CROSS JOIN active_session_data asd
    CROSS JOIN recent_sessions_data rsd
    CROSS JOIN upcoming_meetings_data umd
    CROSS JOIN weekly_progress_data wpd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for leaderboard with caching
CREATE OR REPLACE FUNCTION get_cached_leaderboard(
    p_type VARCHAR DEFAULT 'sessions',
    p_limit INTEGER DEFAULT 10,
    p_timeframe VARCHAR DEFAULT 'all_time'
)
RETURNS TABLE(
    rank INTEGER,
    username VARCHAR(50),
    display_name VARCHAR(100),
    value INTEGER,
    completion_rate DECIMAL(5,2),
    streak_days INTEGER
) AS $$
DECLARE
    v_cache_key TEXT;
    v_cache_expiry INTERVAL := '1 hour';
BEGIN
    -- Use materialized view for better performance
    IF p_type = 'sessions' AND p_timeframe = 'all_time' THEN
        RETURN QUERY
        SELECT 
            uas.session_rank::INTEGER,
            LEFT(uas.username, 1) || REPEAT('*', LENGTH(uas.username) - 1)::VARCHAR(50),
            'Hidden'::VARCHAR(100), -- Privacy protection
            uas.completed_sessions,
            uas.completion_rate,
            uas.streak_days
        FROM user_activity_summary uas
        WHERE uas.completed_sessions > 0
        ORDER BY uas.session_rank
        LIMIT p_limit;
        
    ELSIF p_type = 'minutes' AND p_timeframe = 'all_time' THEN
        RETURN QUERY
        SELECT 
            uas.minute_rank::INTEGER,
            LEFT(uas.username, 1) || REPEAT('*', LENGTH(uas.username) - 1)::VARCHAR(50),
            'Hidden'::VARCHAR(100),
            uas.completed_minutes,
            uas.completion_rate,
            uas.streak_days
        FROM user_activity_summary uas
        WHERE uas.completed_minutes > 0
        ORDER BY uas.minute_rank
        LIMIT p_limit;
        
    ELSIF p_type = 'streak' THEN
        RETURN QUERY
        SELECT 
            uas.streak_rank::INTEGER,
            LEFT(uas.username, 1) || REPEAT('*', LENGTH(uas.username) - 1)::VARCHAR(50),
            'Hidden'::VARCHAR(100),
            uas.streak_days,
            uas.completion_rate,
            uas.streak_days
        FROM user_activity_summary uas
        WHERE uas.streak_days > 0
        ORDER BY uas.streak_rank
        LIMIT p_limit;
        
    ELSE
        -- Fallback to direct query for other combinations
        RETURN QUERY
        SELECT 
            ROW_NUMBER() OVER (ORDER BY us.completed_sessions DESC)::INTEGER,
            LEFT(u.username, 1) || REPEAT('*', LENGTH(u.username) - 1)::VARCHAR(50),
            'Hidden'::VARCHAR(100),
            us.completed_sessions,
            us.completion_rate,
            us.streak_days
        FROM public.user_stats us
        JOIN public.users u ON us.user_id = u.id
        WHERE us.completed_sessions > 0
        ORDER BY us.completed_sessions DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- QUERY OPTIMIZATION HELPERS
-- =====================================================================================

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(p_query TEXT)
RETURNS TABLE(
    execution_time NUMERIC,
    planning_time NUMERIC,
    query_plan TEXT
) AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_execution_time NUMERIC;
    v_plan_result TEXT;
BEGIN
    -- Enable timing
    EXECUTE 'SET track_functions = all';
    EXECUTE 'SET track_activities = on';
    
    -- Record start time
    v_start_time := clock_timestamp();
    
    -- Execute the query (for timing)
    EXECUTE p_query;
    
    -- Record end time
    v_end_time := clock_timestamp();
    v_execution_time := EXTRACT(milliseconds FROM v_end_time - v_start_time);
    
    -- Get query plan
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' || p_query INTO v_plan_result;
    
    RETURN QUERY
    SELECT 
        v_execution_time,
        0::NUMERIC, -- Planning time would need to be extracted from EXPLAIN output
        v_plan_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database performance metrics
CREATE OR REPLACE FUNCTION get_performance_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Total Users'::TEXT,
        COUNT(*)::NUMERIC,
        'count'::TEXT,
        'info'::TEXT
    FROM public.users
    
    UNION ALL
    
    SELECT 
        'Active Sessions Today'::TEXT,
        COUNT(*)::NUMERIC,
        'count'::TEXT,
        CASE WHEN COUNT(*) > 100 THEN 'high' WHEN COUNT(*) > 50 THEN 'medium' ELSE 'low' END::TEXT
    FROM public.pomodoro_sessions
    WHERE DATE(start_time) = CURRENT_DATE
    
    UNION ALL
    
    SELECT 
        'Database Size'::TEXT,
        pg_database_size(current_database())::NUMERIC / (1024*1024),
        'MB'::TEXT,
        'info'::TEXT
    
    UNION ALL
    
    SELECT 
        'Cache Hit Ratio'::TEXT,
        ROUND(
            100 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2
        ),
        '%'::TEXT,
        CASE 
            WHEN ROUND(100 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) > 95 THEN 'good'
            WHEN ROUND(100 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) > 90 THEN 'fair'
            ELSE 'poor'
        END::TEXT
    FROM pg_stat_database
    WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- MAINTENANCE AND OPTIMIZATION TASKS
-- =====================================================================================

-- Function to perform regular maintenance
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT := '';
BEGIN
    -- Update table statistics
    ANALYZE public.users;
    ANALYZE public.user_stats;
    ANALYZE public.pomodoro_sessions;
    ANALYZE public.meetings;
    
    v_result := v_result || 'Table statistics updated. ';
    
    -- Refresh materialized views
    PERFORM refresh_materialized_views();
    v_result := v_result || 'Materialized views refreshed. ';
    
    -- Clean up expired data
    PERFORM cleanup_expired_data();
    v_result := v_result || 'Expired data cleaned. ';
    
    -- Vacuum analyze for performance
    -- Note: In production, this should be done during maintenance windows
    -- VACUUM ANALYZE;
    
    RETURN v_result || 'Maintenance completed at ' || NOW()::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================================================

COMMENT ON MATERIALIZED VIEW user_activity_summary IS 'Cached user activity data for dashboard and leaderboards';
COMMENT ON MATERIALIZED VIEW daily_statistics IS 'Daily aggregated statistics for analytics';
COMMENT ON FUNCTION get_user_dashboard_data(UUID) IS 'Optimized single-query dashboard data retrieval';
COMMENT ON FUNCTION get_cached_leaderboard(VARCHAR, INTEGER, VARCHAR) IS 'High-performance leaderboard with caching';
COMMENT ON FUNCTION refresh_materialized_views() IS 'Refresh all materialized views for updated data';
COMMENT ON FUNCTION perform_maintenance() IS 'Regular database maintenance and optimization';

-- =====================================================================================
-- PERFORMANCE MONITORING SETUP
-- =====================================================================================

\echo ''
\echo '====================================================================================='
\echo 'PERFORMANCE OPTIMIZATION COMPLETED'
\echo '====================================================================================='
\echo ''
\echo 'Optimization features installed:'
\echo '- Advanced composite indexes for common query patterns'
\echo '- Partial indexes for filtered queries'
\echo '- Full-text search capabilities'
\echo '- Materialized views for heavy aggregations'
\echo '- Optimized dashboard and leaderboard functions'
\echo '- Performance monitoring and maintenance tools'
\echo ''
\echo 'Recommended maintenance schedule:'
\echo '- Run refresh_materialized_views() every hour'
\echo '- Run perform_maintenance() daily during low traffic'
\echo '- Monitor get_performance_metrics() regularly'
\echo ''
\echo 'For production deployment:'
\echo '- Set up automated VACUUM and ANALYZE'
\echo '- Configure connection pooling'
\echo '- Monitor query performance with pg_stat_statements'
\echo '- Set appropriate work_mem and shared_buffers'
\echo ''
\echo '====================================================================================='