-- =====================================================================================
-- 🏥 COMPREHENSIVE DATABASE HEALTH CHECK SYSTEM
-- For Pomodoro Timer v4.0.0 Supabase Database
-- =====================================================================================

-- =====================================================================================
-- CORE HEALTH CHECK FUNCTIONS
-- =====================================================================================

-- Main health check function (enhanced version)
CREATE OR REPLACE FUNCTION public.perform_comprehensive_health_check()
RETURNS TABLE(
    category TEXT,
    check_name TEXT,
    status TEXT,
    score INTEGER,
    details TEXT,
    recommendation TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_score INTEGER := 0;
    max_score INTEGER := 0;
BEGIN
    -- =============================================================================
    -- CATEGORY: SCHEMA INTEGRITY
    -- =============================================================================
    
    -- Check 1: Table existence
    max_score := max_score + 20;
    SELECT 
        'Schema'::TEXT,
        'Table Existence'::TEXT,
        CASE 
            WHEN COUNT(*) = 6 THEN 'PASS'::TEXT
            WHEN COUNT(*) >= 4 THEN 'WARN'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) = 6 THEN 20
            WHEN COUNT(*) >= 4 THEN 10
            ELSE 0
        END,
        'Found ' || COUNT(*)::TEXT || ' of 6 expected tables'::TEXT,
        CASE 
            WHEN COUNT(*) < 6 THEN 'Run complete-setup.sql to create missing tables'::TEXT
            ELSE 'All tables present'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- Check 2: Column integrity
    max_score := max_score + 15;
    WITH expected_columns AS (
        SELECT 'users' as table_name, 15 as expected_count
        UNION ALL SELECT 'user_preferences', 11
        UNION ALL SELECT 'user_stats', 14
        UNION ALL SELECT 'pomodoro_sessions', 17
        UNION ALL SELECT 'meetings', 14
        UNION ALL SELECT 'auth_sessions', 14
    ),
    actual_columns AS (
        SELECT 
            table_name,
            COUNT(*) as actual_count
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name IN ('users', 'user_preferences', 'user_stats', 'pomodoro_sessions', 'meetings', 'auth_sessions')
        GROUP BY table_name
    )
    SELECT 
        'Schema'::TEXT,
        'Column Integrity'::TEXT,
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.expected_count = a.actual_count) = 6 THEN 'PASS'::TEXT
            WHEN COUNT(*) FILTER (WHERE e.expected_count = a.actual_count) >= 4 THEN 'WARN'::TEXT
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.expected_count = a.actual_count) = 6 THEN 15
            WHEN COUNT(*) FILTER (WHERE e.expected_count = a.actual_count) >= 4 THEN 8
            ELSE 0
        END,
        'Column counts: ' || string_agg(a.table_name || '(' || a.actual_count || '/' || e.expected_count || ')', ', '),
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.expected_count != a.actual_count) > 0 
            THEN 'Some tables have unexpected column counts - verify schema'::TEXT
            ELSE 'All tables have expected columns'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM expected_columns e
    LEFT JOIN actual_columns a ON e.table_name = a.table_name;
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- =============================================================================
    -- CATEGORY: SECURITY
    -- =============================================================================
    
    -- Check 3: RLS enabled
    max_score := max_score + 20;
    SELECT 
        'Security'::TEXT,
        'Row Level Security'::TEXT,
        CASE 
            WHEN COUNT(*) = 6 THEN 'PASS'::TEXT
            WHEN COUNT(*) >= 4 THEN 'WARN'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) = 6 THEN 20
            WHEN COUNT(*) >= 4 THEN 10
            ELSE 0
        END,
        'RLS enabled on ' || COUNT(*)::TEXT || ' of 6 tables'::TEXT,
        CASE 
            WHEN COUNT(*) < 6 THEN 'Enable RLS on all tables for security'::TEXT
            ELSE 'RLS properly configured'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true;
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- Check 4: RLS policies
    max_score := max_score + 15;
    SELECT 
        'Security'::TEXT,
        'RLS Policies'::TEXT,
        CASE 
            WHEN COUNT(*) >= 6 THEN 'PASS'::TEXT
            WHEN COUNT(*) >= 3 THEN 'WARN'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) >= 6 THEN 15
            WHEN COUNT(*) >= 3 THEN 8
            ELSE 0
        END,
        'Found ' || COUNT(*)::TEXT || ' RLS policies'::TEXT,
        CASE 
            WHEN COUNT(*) < 6 THEN 'Create RLS policies for all tables'::TEXT
            ELSE 'RLS policies configured'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- =============================================================================
    -- CATEGORY: PERFORMANCE
    -- =============================================================================
    
    -- Check 5: Indexes
    max_score := max_score + 15;
    SELECT 
        'Performance'::TEXT,
        'Database Indexes'::TEXT,
        CASE 
            WHEN COUNT(*) >= 20 THEN 'PASS'::TEXT
            WHEN COUNT(*) >= 15 THEN 'WARN'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) >= 20 THEN 15
            WHEN COUNT(*) >= 15 THEN 10
            ELSE 5
        END,
        'Found ' || COUNT(*)::TEXT || ' indexes'::TEXT,
        CASE 
            WHEN COUNT(*) < 15 THEN 'Add more indexes for better performance'::TEXT
            ELSE 'Adequate indexing present'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- =============================================================================
    -- CATEGORY: FUNCTIONALITY
    -- =============================================================================
    
    -- Check 6: Functions
    max_score := max_score + 10;
    SELECT 
        'Functionality'::TEXT,
        'Database Functions'::TEXT,
        CASE 
            WHEN COUNT(*) >= 8 THEN 'PASS'::TEXT
            WHEN COUNT(*) >= 5 THEN 'WARN'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) >= 8 THEN 10
            WHEN COUNT(*) >= 5 THEN 5
            ELSE 0
        END,
        'Found ' || COUNT(*)::TEXT || ' functions'::TEXT,
        CASE 
            WHEN COUNT(*) < 5 THEN 'Install missing database functions'::TEXT
            ELSE 'Core functions available'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- Check 7: Triggers
    max_score := max_score + 10;
    SELECT 
        'Functionality'::TEXT,
        'Database Triggers'::TEXT,
        CASE 
            WHEN COUNT(*) >= 5 THEN 'PASS'::TEXT
            WHEN COUNT(*) >= 3 THEN 'WARN'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        CASE 
            WHEN COUNT(*) >= 5 THEN 10
            WHEN COUNT(*) >= 3 THEN 5
            ELSE 0
        END,
        'Found ' || COUNT(*)::TEXT || ' triggers'::TEXT,
        CASE 
            WHEN COUNT(*) < 3 THEN 'Install missing triggers for automation'::TEXT
            ELSE 'Triggers properly configured'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- =============================================================================
    -- CATEGORY: DATA INTEGRITY
    -- =============================================================================
    
    -- Check 8: Sample data
    max_score := max_score + 5;
    SELECT 
        'Data'::TEXT,
        'Sample Data'::TEXT,
        CASE 
            WHEN EXISTS(SELECT 1 FROM public.users LIMIT 1) THEN 'PASS'::TEXT
            ELSE 'WARN'::TEXT 
        END,
        CASE 
            WHEN EXISTS(SELECT 1 FROM public.users LIMIT 1) THEN 5
            ELSE 0
        END,
        CASE 
            WHEN EXISTS(SELECT 1 FROM public.users LIMIT 1) THEN 'Sample data available'::TEXT
            ELSE 'No sample data found'::TEXT
        END,
        CASE 
            WHEN NOT EXISTS(SELECT 1 FROM public.users LIMIT 1) THEN 'Consider adding sample data for testing'::TEXT
            ELSE 'Sample data ready for testing'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation;
    
    total_score := total_score + score;
    RETURN NEXT;
    
    -- =============================================================================
    -- FINAL SCORE SUMMARY
    -- =============================================================================
    
    SELECT 
        'Summary'::TEXT,
        'Overall Health Score'::TEXT,
        CASE 
            WHEN (total_score::FLOAT / max_score * 100) >= 90 THEN 'EXCELLENT'::TEXT
            WHEN (total_score::FLOAT / max_score * 100) >= 80 THEN 'GOOD'::TEXT
            WHEN (total_score::FLOAT / max_score * 100) >= 70 THEN 'FAIR'::TEXT
            WHEN (total_score::FLOAT / max_score * 100) >= 60 THEN 'POOR'::TEXT
            ELSE 'CRITICAL'::TEXT
        END,
        (total_score::FLOAT / max_score * 100)::INTEGER,
        'Score: ' || total_score || '/' || max_score || ' (' || 
            ROUND(total_score::FLOAT / max_score * 100, 1) || '%)'::TEXT,
        CASE 
            WHEN (total_score::FLOAT / max_score * 100) >= 90 THEN 'Database is in excellent condition'::TEXT
            WHEN (total_score::FLOAT / max_score * 100) >= 80 THEN 'Database is in good condition with minor issues'::TEXT
            WHEN (total_score::FLOAT / max_score * 100) >= 70 THEN 'Database needs attention - review warnings'::TEXT
            WHEN (total_score::FLOAT / max_score * 100) >= 60 THEN 'Database has significant issues'::TEXT
            ELSE 'Database requires immediate attention'::TEXT
        END
    INTO category, check_name, status, score, details, recommendation;
    
    RETURN NEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        SELECT 
            'Error'::TEXT, 
            'Health Check Error'::TEXT, 
            'FAIL'::TEXT, 
            0,
            SQLERRM::TEXT,
            'Fix the error and retry health check'::TEXT
        INTO category, check_name, status, score, details, recommendation;
        RETURN NEXT;
END;
$$;

-- =====================================================================================
-- PERFORMANCE METRICS FUNCTION
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.get_detailed_performance_metrics()
RETURNS TABLE(
    category TEXT,
    metric_name TEXT,
    metric_value TEXT,
    metric_unit TEXT,
    status TEXT,
    benchmark TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Database size metrics
    RETURN QUERY
    SELECT 
        'Storage'::TEXT,
        'Database Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'bytes'::TEXT,
        CASE 
            WHEN pg_database_size(current_database()) < 100 * 1024 * 1024 THEN 'GOOD'::TEXT  -- < 100MB
            WHEN pg_database_size(current_database()) < 1024 * 1024 * 1024 THEN 'WARN'::TEXT  -- < 1GB
            ELSE 'CRITICAL'::TEXT
        END,
        '< 100MB: Good, < 1GB: Warning, > 1GB: Critical'::TEXT;
    
    -- Table sizes
    RETURN QUERY
    SELECT 
        'Storage'::TEXT,
        'Users Table Size'::TEXT,
        pg_size_pretty(pg_total_relation_size('public.users'))::TEXT,
        'bytes'::TEXT,
        'INFO'::TEXT,
        'Monitor growth over time'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Storage'::TEXT,
        'Sessions Table Size'::TEXT,
        pg_size_pretty(pg_total_relation_size('public.pomodoro_sessions'))::TEXT,
        'bytes'::TEXT,
        'INFO'::TEXT,
        'Archive old sessions if needed'::TEXT;
    
    -- Record counts
    RETURN QUERY
    SELECT 
        'Data'::TEXT,
        'Total Users'::TEXT, 
        COUNT(*)::TEXT, 
        'records'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'WARN'::TEXT
            WHEN COUNT(*) < 10000 THEN 'GOOD'::TEXT
            ELSE 'INFO'::TEXT
        END,
        'Monitor user growth'::TEXT
    FROM public.users;
    
    RETURN QUERY
    SELECT 
        'Data'::TEXT,
        'Total Sessions'::TEXT, 
        COUNT(*)::TEXT, 
        'records'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'WARN'::TEXT
            WHEN COUNT(*) < 100000 THEN 'GOOD'::TEXT
            ELSE 'INFO'::TEXT
        END,
        'Consider archiving old sessions'::TEXT
    FROM public.pomodoro_sessions;
    
    RETURN QUERY
    SELECT 
        'Data'::TEXT,
        'Active Sessions'::TEXT, 
        COUNT(*)::TEXT, 
        'records'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'GOOD'::TEXT
            WHEN COUNT(*) < 100 THEN 'GOOD'::TEXT
            ELSE 'WARN'::TEXT
        END,
        'Clean up stale active sessions'::TEXT
    FROM public.pomodoro_sessions WHERE is_active = TRUE;
    
    -- Connection and performance info
    RETURN QUERY
    SELECT 
        'Performance'::TEXT,
        'Active Connections'::TEXT,
        COUNT(*)::TEXT,
        'connections'::TEXT,
        CASE 
            WHEN COUNT(*) < 20 THEN 'GOOD'::TEXT
            WHEN COUNT(*) < 50 THEN 'WARN'::TEXT
            ELSE 'CRITICAL'::TEXT
        END,
        'Monitor connection pool usage'::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Check for long-running queries (if pg_stat_statements is available)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RETURN QUERY
        SELECT 
            'Performance'::TEXT,
            'Slow Queries'::TEXT,
            COUNT(*)::TEXT,
            'queries'::TEXT,
            CASE 
                WHEN COUNT(*) = 0 THEN 'GOOD'::TEXT
                WHEN COUNT(*) < 5 THEN 'WARN'::TEXT
                ELSE 'CRITICAL'::TEXT
            END,
            'Optimize queries taking > 1 second'::TEXT
        FROM pg_stat_statements 
        WHERE mean_exec_time > 1000;  -- > 1 second
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT 
            'Error'::TEXT,
            'Metrics Error'::TEXT,
            SQLERRM::TEXT,
            'error'::TEXT,
            'FAIL'::TEXT,
            'Fix error and retry metrics'::TEXT;
END;
$$;

-- =====================================================================================
-- DATA INTEGRITY VALIDATION
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    issue_count INTEGER,
    details TEXT,
    fix_sql TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    orphaned_prefs INTEGER := 0;
    orphaned_stats INTEGER := 0;
    orphaned_sessions INTEGER := 0;
    orphaned_meetings INTEGER := 0;
    orphaned_auth_sessions INTEGER := 0;
    invalid_sessions INTEGER := 0;
    future_sessions INTEGER := 0;
BEGIN
    -- Check for orphaned user preferences
    SELECT COUNT(*) INTO orphaned_prefs
    FROM public.user_preferences up
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = up.user_id);
    
    RETURN QUERY
    SELECT 
        'Orphaned User Preferences'::TEXT,
        CASE WHEN orphaned_prefs = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        orphaned_prefs,
        CASE 
            WHEN orphaned_prefs = 0 THEN 'No orphaned preferences found'::TEXT
            ELSE orphaned_prefs || ' orphaned preference records'::TEXT
        END,
        CASE 
            WHEN orphaned_prefs = 0 THEN ''::TEXT
            ELSE 'DELETE FROM user_preferences WHERE user_id NOT IN (SELECT id FROM users);'::TEXT
        END;
    
    -- Check for orphaned user stats
    SELECT COUNT(*) INTO orphaned_stats
    FROM public.user_stats us
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = us.user_id);
    
    RETURN QUERY
    SELECT 
        'Orphaned User Stats'::TEXT,
        CASE WHEN orphaned_stats = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        orphaned_stats,
        CASE 
            WHEN orphaned_stats = 0 THEN 'No orphaned stats found'::TEXT
            ELSE orphaned_stats || ' orphaned stats records'::TEXT
        END,
        CASE 
            WHEN orphaned_stats = 0 THEN ''::TEXT
            ELSE 'DELETE FROM user_stats WHERE user_id NOT IN (SELECT id FROM users);'::TEXT
        END;
    
    -- Check for orphaned pomodoro sessions
    SELECT COUNT(*) INTO orphaned_sessions
    FROM public.pomodoro_sessions ps
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = ps.user_id);
    
    RETURN QUERY
    SELECT 
        'Orphaned Pomodoro Sessions'::TEXT,
        CASE WHEN orphaned_sessions = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        orphaned_sessions,
        CASE 
            WHEN orphaned_sessions = 0 THEN 'No orphaned sessions found'::TEXT
            ELSE orphaned_sessions || ' orphaned session records'::TEXT
        END,
        CASE 
            WHEN orphaned_sessions = 0 THEN ''::TEXT
            ELSE 'DELETE FROM pomodoro_sessions WHERE user_id NOT IN (SELECT id FROM users);'::TEXT
        END;
    
    -- Check for orphaned meetings
    SELECT COUNT(*) INTO orphaned_meetings
    FROM public.meetings m
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = m.user_id);
    
    RETURN QUERY
    SELECT 
        'Orphaned Meetings'::TEXT,
        CASE WHEN orphaned_meetings = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        orphaned_meetings,
        CASE 
            WHEN orphaned_meetings = 0 THEN 'No orphaned meetings found'::TEXT
            ELSE orphaned_meetings || ' orphaned meeting records'::TEXT
        END,
        CASE 
            WHEN orphaned_meetings = 0 THEN ''::TEXT
            ELSE 'DELETE FROM meetings WHERE user_id NOT IN (SELECT id FROM users);'::TEXT
        END;
    
    -- Check for orphaned auth sessions
    SELECT COUNT(*) INTO orphaned_auth_sessions
    FROM public.auth_sessions as_table
    WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = as_table.user_id);
    
    RETURN QUERY
    SELECT 
        'Orphaned Auth Sessions'::TEXT,
        CASE WHEN orphaned_auth_sessions = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        orphaned_auth_sessions,
        CASE 
            WHEN orphaned_auth_sessions = 0 THEN 'No orphaned auth sessions found'::TEXT
            ELSE orphaned_auth_sessions || ' orphaned auth session records'::TEXT
        END,
        CASE 
            WHEN orphaned_auth_sessions = 0 THEN ''::TEXT
            ELSE 'DELETE FROM auth_sessions WHERE user_id NOT IN (SELECT id FROM users);'::TEXT
        END;
    
    -- Check for invalid session data
    SELECT COUNT(*) INTO invalid_sessions
    FROM public.pomodoro_sessions
    WHERE end_time <= start_time OR duration <= 0 OR duration > 240;
    
    RETURN QUERY
    SELECT 
        'Invalid Session Data'::TEXT,
        CASE WHEN invalid_sessions = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        invalid_sessions,
        CASE 
            WHEN invalid_sessions = 0 THEN 'All sessions have valid data'::TEXT
            ELSE invalid_sessions || ' sessions with invalid timing or duration'::TEXT
        END,
        CASE 
            WHEN invalid_sessions = 0 THEN ''::TEXT
            ELSE 'UPDATE pomodoro_sessions SET status = ''invalid'' WHERE end_time <= start_time OR duration <= 0 OR duration > 240;'::TEXT
        END;
    
    -- Check for future sessions that should be cleaned up
    SELECT COUNT(*) INTO future_sessions
    FROM public.pomodoro_sessions
    WHERE start_time > NOW() + INTERVAL '1 day' AND status != 'scheduled';
    
    RETURN QUERY
    SELECT 
        'Future Sessions'::TEXT,
        CASE WHEN future_sessions = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        future_sessions,
        CASE 
            WHEN future_sessions = 0 THEN 'No suspicious future sessions'::TEXT
            ELSE future_sessions || ' sessions far in the future'::TEXT
        END,
        CASE 
            WHEN future_sessions = 0 THEN ''::TEXT
            ELSE 'Review sessions starting more than 1 day in the future'::TEXT
        END;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT 
            'Data Integrity Error'::TEXT,
            'FAIL'::TEXT,
            -1,
            SQLERRM::TEXT,
            'Fix error and retry validation'::TEXT;
END;
$$;

-- =====================================================================================
-- MAINTENANCE AND OPTIMIZATION FUNCTIONS
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.perform_maintenance()
RETURNS TABLE(
    task_name TEXT,
    status TEXT,
    rows_affected INTEGER,
    execution_time TEXT,
    details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    deleted_sessions INTEGER := 0;
    updated_stats INTEGER := 0;
BEGIN
    -- Task 1: Clean up expired auth sessions
    start_time := NOW();
    
    DELETE FROM public.auth_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days'
    OR (invalidated_at IS NOT NULL AND invalidated_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
    end_time := NOW();
    
    RETURN QUERY
    SELECT 
        'Cleanup Expired Sessions'::TEXT,
        'COMPLETED'::TEXT,
        deleted_sessions,
        EXTRACT(EPOCH FROM (end_time - start_time))::TEXT || ' seconds',
        'Removed ' || deleted_sessions || ' expired auth sessions'::TEXT;
    
    -- Task 2: Update user statistics
    start_time := NOW();
    
    WITH users_to_update AS (
        SELECT DISTINCT user_id 
        FROM public.pomodoro_sessions 
        WHERE updated_at >= NOW() - INTERVAL '1 day'
    )
    SELECT COUNT(*) INTO updated_stats
    FROM users_to_update;
    
    -- Update stats for users with recent activity
    PERFORM public.update_user_statistics(user_id)
    FROM (
        SELECT DISTINCT user_id 
        FROM public.pomodoro_sessions 
        WHERE updated_at >= NOW() - INTERVAL '1 day'
    ) recent_users;
    
    end_time := NOW();
    
    RETURN QUERY
    SELECT 
        'Update User Statistics'::TEXT,
        'COMPLETED'::TEXT,
        updated_stats,
        EXTRACT(EPOCH FROM (end_time - start_time))::TEXT || ' seconds',
        'Updated statistics for ' || updated_stats || ' users'::TEXT;
    
    -- Task 3: Analyze tables for query optimization
    start_time := NOW();
    
    ANALYZE public.users;
    ANALYZE public.pomodoro_sessions;
    ANALYZE public.user_stats;
    ANALYZE public.meetings;
    
    end_time := NOW();
    
    RETURN QUERY
    SELECT 
        'Analyze Tables'::TEXT,
        'COMPLETED'::TEXT,
        4,  -- number of tables analyzed
        EXTRACT(EPOCH FROM (end_time - start_time))::TEXT || ' seconds',
        'Updated query planner statistics for all tables'::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT 
            'Maintenance Error'::TEXT,
            'FAILED'::TEXT,
            -1,
            '0 seconds'::TEXT,
            SQLERRM::TEXT;
END;
$$;

-- =====================================================================================
-- BACKUP AND EXPORT FUNCTIONS
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_data JSONB := '{}';
    user_info JSONB;
    preferences JSONB;
    stats JSONB;
    sessions JSONB;
    meetings JSONB;
BEGIN
    -- Get user basic info
    SELECT to_jsonb(row.*) INTO user_info
    FROM (
        SELECT id, username, display_name, email, avatar, bio, 
               email_verified, created_at, updated_at
        FROM public.users 
        WHERE id = p_user_id
    ) row;
    
    -- Get user preferences
    SELECT to_jsonb(row.*) INTO preferences
    FROM (
        SELECT * FROM public.user_preferences 
        WHERE user_id = p_user_id
    ) row;
    
    -- Get user statistics
    SELECT to_jsonb(row.*) INTO stats
    FROM (
        SELECT * FROM public.user_stats 
        WHERE user_id = p_user_id
    ) row;
    
    -- Get pomodoro sessions
    SELECT jsonb_agg(to_jsonb(row.*)) INTO sessions
    FROM (
        SELECT * FROM public.pomodoro_sessions 
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
    ) row;
    
    -- Get meetings
    SELECT jsonb_agg(to_jsonb(row.*)) INTO meetings
    FROM (
        SELECT * FROM public.meetings 
        WHERE user_id = p_user_id
        ORDER BY meeting_date, meeting_time
    ) row;
    
    -- Combine all data
    user_data := jsonb_build_object(
        'user', user_info,
        'preferences', preferences,
        'statistics', stats,
        'sessions', COALESCE(sessions, '[]'::jsonb),
        'meetings', COALESCE(meetings, '[]'::jsonb),
        'exported_at', NOW(),
        'export_version', '1.0'
    );
    
    RETURN user_data;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error', SQLERRM,
            'exported_at', NOW()
        );
END;
$$;

-- =====================================================================================
-- QUICK DIAGNOSTIC FUNCTION
-- =====================================================================================

CREATE OR REPLACE FUNCTION public.quick_diagnostic()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result TEXT := '';
    health_record RECORD;
    overall_status TEXT := 'UNKNOWN';
    score_count INTEGER := 0;
    total_score INTEGER := 0;
BEGIN
    result := E'🏥 QUICK DIAGNOSTIC REPORT\n';
    result := result || E'Generated: ' || NOW() || E'\n\n';
    
    -- Run basic health checks
    FOR health_record IN 
        SELECT * FROM public.perform_comprehensive_health_check()
        WHERE category != 'Summary'
    LOOP
        result := result || '• ' || health_record.check_name || ': ' || health_record.status;
        
        IF health_record.status = 'FAIL' THEN
            result := result || ' ❌';
        ELSIF health_record.status = 'WARN' THEN
            result := result || ' ⚠️';
        ELSE
            result := result || ' ✅';
        END IF;
        
        result := result || E'\n  ' || health_record.details || E'\n';
        
        IF health_record.recommendation != '' AND health_record.status != 'PASS' THEN
            result := result || E'  💡 ' || health_record.recommendation || E'\n';
        END IF;
        
        result := result || E'\n';
        
        total_score := total_score + health_record.score;
        score_count := score_count + 1;
    END LOOP;
    
    -- Add summary
    SELECT health_record.status INTO overall_status
    FROM public.perform_comprehensive_health_check() health_record
    WHERE health_record.category = 'Summary';
    
    result := result || E'📊 OVERALL STATUS: ' || overall_status || E'\n';
    result := result || E'🎯 TOTAL SCORE: ' || total_score || E'\n\n';
    
    CASE overall_status
        WHEN 'EXCELLENT' THEN
            result := result || E'🎉 Your database is in excellent condition!';
        WHEN 'GOOD' THEN
            result := result || E'✅ Your database is in good shape with minor issues.';
        WHEN 'FAIR' THEN
            result := result || E'⚠️  Your database needs attention. Review the warnings above.';
        WHEN 'POOR' THEN
            result := result || E'🚨 Your database has significant issues that need fixing.';
        ELSE
            result := result || E'🆘 Your database requires immediate attention!';
    END CASE;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN E'❌ Diagnostic failed: ' || SQLERRM;
END;
$$;

-- =====================================================================================
-- PERMISSIONS AND COMMENTS
-- =====================================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.perform_comprehensive_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_detailed_performance_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_data_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_maintenance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quick_diagnostic() TO authenticated;

-- Add documentation comments
COMMENT ON FUNCTION public.perform_comprehensive_health_check() IS 
'Comprehensive health check with scoring system for database validation';

COMMENT ON FUNCTION public.get_detailed_performance_metrics() IS 
'Detailed performance metrics with status indicators and benchmarks';

COMMENT ON FUNCTION public.validate_data_integrity() IS 
'Validates referential integrity and provides fix suggestions';

COMMENT ON FUNCTION public.perform_maintenance() IS 
'Automated maintenance tasks including cleanup and optimization';

COMMENT ON FUNCTION public.export_user_data(UUID) IS 
'Exports complete user data in JSON format for backup or migration';

COMMENT ON FUNCTION public.quick_diagnostic() IS 
'Quick text-based diagnostic report for immediate status overview';