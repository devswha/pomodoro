-- =====================================================================================
-- Database Functions and Triggers for Pomodoro Timer
-- Automated statistics calculation and data management
-- =====================================================================================

-- =====================================================================================
-- UTILITY FUNCTIONS
-- =====================================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pomodoro_sessions_updated_at BEFORE UPDATE ON public.pomodoro_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- USER INITIALIZATION FUNCTIONS
-- =====================================================================================

-- Function to initialize user data after registration
CREATE OR REPLACE FUNCTION initialize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create user preferences with defaults
    INSERT INTO public.user_preferences (user_id) 
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create user stats with defaults
    INSERT INTO public.user_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically initialize user data on registration
CREATE OR REPLACE FUNCTION trigger_initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_user_data(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION trigger_initialize_user_data();

-- =====================================================================================
-- STATISTICS CALCULATION FUNCTIONS
-- =====================================================================================

-- Function to update user statistics after session changes
CREATE OR REPLACE FUNCTION update_user_statistics(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_sessions INTEGER;
    v_completed_sessions INTEGER;
    v_total_minutes INTEGER;
    v_completed_minutes INTEGER;
    v_completion_rate DECIMAL(5,2);
    v_avg_session_length DECIMAL(8,2);
    v_last_session_date DATE;
    v_current_stats RECORD;
BEGIN
    -- Get current statistics from pomodoro sessions
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        SUM(duration) as total_min,
        SUM(duration) FILTER (WHERE status = 'completed') as completed_min,
        MAX(DATE(start_time)) as last_date
    INTO v_total_sessions, v_completed_sessions, v_total_minutes, v_completed_minutes, v_last_session_date
    FROM public.pomodoro_sessions 
    WHERE user_id = p_user_id;
    
    -- Handle NULL values
    v_total_sessions := COALESCE(v_total_sessions, 0);
    v_completed_sessions := COALESCE(v_completed_sessions, 0);
    v_total_minutes := COALESCE(v_total_minutes, 0);
    v_completed_minutes := COALESCE(v_completed_minutes, 0);
    
    -- Calculate metrics
    v_completion_rate := CASE 
        WHEN v_total_sessions > 0 THEN 
            ROUND((v_completed_sessions::DECIMAL / v_total_sessions) * 100, 2)
        ELSE 0 
    END;
    
    v_avg_session_length := CASE 
        WHEN v_completed_sessions > 0 THEN 
            ROUND(v_completed_minutes::DECIMAL / v_completed_sessions, 2)
        ELSE 0 
    END;
    
    -- Get current streak data to preserve it
    SELECT streak_days, longest_streak 
    INTO v_current_stats
    FROM public.user_stats 
    WHERE user_id = p_user_id;
    
    -- Update user statistics
    UPDATE public.user_stats SET
        total_sessions = v_total_sessions,
        completed_sessions = v_completed_sessions,
        total_minutes = v_total_minutes,
        completed_minutes = v_completed_minutes,
        completion_rate = v_completion_rate,
        average_session_length = v_avg_session_length,
        last_session_date = v_last_session_date,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Update aggregated JSON data
    PERFORM update_user_aggregated_stats(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update aggregated JSON statistics (daily, monthly, tags, locations)
CREATE OR REPLACE FUNCTION update_user_aggregated_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_daily_stats JSONB;
    v_monthly_stats JSONB;
    v_tags_stats JSONB;
    v_locations_stats JSONB;
BEGIN
    -- Calculate daily statistics
    SELECT jsonb_object_agg(
        session_date,
        jsonb_build_object(
            'sessions', session_count,
            'minutes', total_minutes,
            'completed', completed_count
        )
    ) INTO v_daily_stats
    FROM (
        SELECT 
            DATE(start_time) as session_date,
            COUNT(*) as session_count,
            SUM(duration) as total_minutes,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count
        FROM public.pomodoro_sessions 
        WHERE user_id = p_user_id
        GROUP BY DATE(start_time)
    ) daily_data;
    
    -- Calculate monthly statistics
    SELECT jsonb_object_agg(
        month_key,
        jsonb_build_object(
            'sessions', session_count,
            'minutes', total_minutes,
            'completed', completed_count
        )
    ) INTO v_monthly_stats
    FROM (
        SELECT 
            TO_CHAR(start_time, 'YYYY-MM') as month_key,
            COUNT(*) as session_count,
            SUM(duration) as total_minutes,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count
        FROM public.pomodoro_sessions 
        WHERE user_id = p_user_id
        GROUP BY TO_CHAR(start_time, 'YYYY-MM')
    ) monthly_data;
    
    -- Calculate tag statistics
    SELECT jsonb_object_agg(
        tag,
        jsonb_build_object(
            'count', tag_count,
            'minutes', total_minutes
        )
    ) INTO v_tags_stats
    FROM (
        SELECT 
            TRIM(tag_item) as tag,
            COUNT(*) as tag_count,
            SUM(duration) as total_minutes
        FROM public.pomodoro_sessions,
             LATERAL string_to_table(tags, ',') as tag_item
        WHERE user_id = p_user_id 
          AND tags IS NOT NULL 
          AND tags != ''
          AND TRIM(tag_item) != ''
        GROUP BY TRIM(tag_item)
    ) tag_data;
    
    -- Calculate location statistics
    SELECT jsonb_object_agg(
        location,
        jsonb_build_object(
            'count', location_count,
            'minutes', total_minutes
        )
    ) INTO v_locations_stats
    FROM (
        SELECT 
            location,
            COUNT(*) as location_count,
            SUM(duration) as total_minutes
        FROM public.pomodoro_sessions 
        WHERE user_id = p_user_id 
          AND location IS NOT NULL 
          AND location != ''
        GROUP BY location
    ) location_data;
    
    -- Update the aggregated stats
    UPDATE public.user_stats SET
        daily_stats = COALESCE(v_daily_stats, '{}'::jsonb),
        monthly_stats = COALESCE(v_monthly_stats, '{}'::jsonb),
        tags = COALESCE(v_tags_stats, '{}'::jsonb),
        locations = COALESCE(v_locations_stats, '{}'::jsonb),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak calculation
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID, p_session_date DATE)
RETURNS VOID AS $$
DECLARE
    v_current_stats RECORD;
    v_new_streak INTEGER;
    v_new_longest INTEGER;
    v_days_diff INTEGER;
BEGIN
    -- Get current streak data
    SELECT streak_days, longest_streak, last_session_date
    INTO v_current_stats
    FROM public.user_stats 
    WHERE user_id = p_user_id;
    
    -- Initialize if no previous data
    IF v_current_stats.last_session_date IS NULL THEN
        v_new_streak := 1;
        v_new_longest := GREATEST(COALESCE(v_current_stats.longest_streak, 0), 1);
    ELSE
        -- Calculate days difference
        v_days_diff := p_session_date - v_current_stats.last_session_date;
        
        IF v_days_diff = 0 THEN
            -- Same day, keep current streak
            v_new_streak := COALESCE(v_current_stats.streak_days, 1);
            v_new_longest := COALESCE(v_current_stats.longest_streak, 1);
        ELSIF v_days_diff = 1 THEN
            -- Next day, increase streak
            v_new_streak := COALESCE(v_current_stats.streak_days, 0) + 1;
            v_new_longest := GREATEST(COALESCE(v_current_stats.longest_streak, 0), v_new_streak);
        ELSE
            -- Streak broken, reset
            v_new_streak := 1;
            v_new_longest := COALESCE(v_current_stats.longest_streak, 1);
        END IF;
    END IF;
    
    -- Update streak data
    UPDATE public.user_stats SET
        streak_days = v_new_streak,
        longest_streak = v_new_longest,
        last_session_date = p_session_date,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- SESSION MANAGEMENT FUNCTIONS
-- =====================================================================================

-- Function to start a pomodoro session
CREATE OR REPLACE FUNCTION start_pomodoro_session(
    p_user_id UUID,
    p_title VARCHAR(255) DEFAULT 'Pomodoro Session',
    p_goal TEXT DEFAULT '',
    p_tags TEXT DEFAULT '',
    p_location VARCHAR(100) DEFAULT '',
    p_duration INTEGER DEFAULT 25,
    p_scheduled_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    -- Calculate start time
    v_start_time := COALESCE(p_scheduled_time, NOW());
    v_end_time := v_start_time + (p_duration || ' minutes')::INTERVAL;
    
    -- Deactivate any existing active sessions
    UPDATE public.pomodoro_sessions 
    SET is_active = FALSE, status = 'stopped', stopped_at = NOW()
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Create new session
    INSERT INTO public.pomodoro_sessions (
        user_id, title, goal, tags, location, duration,
        start_time, end_time, scheduled_time, status, is_active
    ) VALUES (
        p_user_id, p_title, p_goal, p_tags, p_location, p_duration,
        v_start_time, v_end_time, p_scheduled_time, 'active', TRUE
    ) RETURNING id INTO v_session_id;
    
    -- Update statistics
    PERFORM update_user_statistics(p_user_id);
    PERFORM update_user_streak(p_user_id, DATE(v_start_time));
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a pomodoro session
CREATE OR REPLACE FUNCTION complete_pomodoro_session(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_session_exists BOOLEAN;
BEGIN
    -- Check if session exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM public.pomodoro_sessions 
        WHERE id = p_session_id AND user_id = p_user_id AND is_active = TRUE
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Complete the session
    UPDATE public.pomodoro_sessions SET
        status = 'completed',
        is_active = FALSE,
        completed_at = NOW()
    WHERE id = p_session_id AND user_id = p_user_id;
    
    -- Update statistics
    PERFORM update_user_statistics(p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to stop a pomodoro session
CREATE OR REPLACE FUNCTION stop_pomodoro_session(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_session_exists BOOLEAN;
BEGIN
    -- Check if session exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM public.pomodoro_sessions 
        WHERE id = p_session_id AND user_id = p_user_id AND is_active = TRUE
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Stop the session
    UPDATE public.pomodoro_sessions SET
        status = 'stopped',
        is_active = FALSE,
        stopped_at = NOW()
    WHERE id = p_session_id AND user_id = p_user_id;
    
    -- Update statistics
    PERFORM update_user_statistics(p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active session for a user
CREATE OR REPLACE FUNCTION get_active_session(p_user_id UUID)
RETURNS TABLE(
    session_id UUID,
    title VARCHAR(255),
    goal TEXT,
    tags TEXT,
    location VARCHAR(100),
    duration INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id, ps.title, ps.goal, ps.tags, ps.location, ps.duration,
        ps.start_time, ps.end_time, ps.status
    FROM public.pomodoro_sessions ps
    WHERE ps.user_id = p_user_id AND ps.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- TRIGGERS FOR AUTOMATIC STATISTICS UPDATES
-- =====================================================================================

-- Trigger function to update statistics when sessions change
CREATE OR REPLACE FUNCTION trigger_update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics for the affected user
    IF TG_OP = 'DELETE' THEN
        PERFORM update_user_statistics(OLD.user_id);
        RETURN OLD;
    ELSE
        PERFORM update_user_statistics(NEW.user_id);
        
        -- Update streak if session is completed or new
        IF NEW.status = 'completed' OR (TG_OP = 'INSERT' AND NEW.start_time IS NOT NULL) THEN
            PERFORM update_user_streak(NEW.user_id, DATE(NEW.start_time));
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to pomodoro sessions table
CREATE TRIGGER after_pomodoro_session_change 
    AFTER INSERT OR UPDATE OR DELETE ON public.pomodoro_sessions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_session_stats();

-- =====================================================================================
-- CLEANUP FUNCTIONS
-- =====================================================================================

-- Function to clean up expired sessions and inactive data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
BEGIN
    -- Clean up expired auth sessions
    DELETE FROM public.auth_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days'
       OR (is_active = FALSE AND invalidated_at < NOW() - INTERVAL '30 days');
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    -- Clean up old completed sessions (older than 2 years)
    DELETE FROM public.pomodoro_sessions 
    WHERE status IN ('completed', 'stopped') 
      AND created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;
    
    -- Clean up old meetings (older than 1 year and completed/cancelled)
    DELETE FROM public.meetings 
    WHERE status IN ('completed', 'cancelled') 
      AND meeting_date < CURRENT_DATE - INTERVAL '1 year';
    
    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;
    
    RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- =====================================================================================

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    p_user_id UUID, 
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_sessions INTEGER,
    completed_sessions INTEGER,
    total_minutes INTEGER,
    completed_minutes INTEGER,
    completion_rate DECIMAL(5,2),
    current_streak INTEGER,
    longest_streak INTEGER,
    activity_by_day JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_activity AS (
        SELECT 
            DATE(start_time) as activity_date,
            COUNT(*) as sessions,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            SUM(duration) as total_mins,
            SUM(duration) FILTER (WHERE status = 'completed') as completed_mins
        FROM public.pomodoro_sessions 
        WHERE user_id = p_user_id 
          AND start_time >= CURRENT_DATE - (p_days || ' days')::INTERVAL
        GROUP BY DATE(start_time)
    )
    SELECT 
        (SELECT COALESCE(SUM(sessions), 0)::INTEGER FROM daily_activity),
        (SELECT COALESCE(SUM(completed), 0)::INTEGER FROM daily_activity),
        (SELECT COALESCE(SUM(total_mins), 0)::INTEGER FROM daily_activity),
        (SELECT COALESCE(SUM(completed_mins), 0)::INTEGER FROM daily_activity),
        us.completion_rate,
        us.streak_days,
        us.longest_streak,
        (SELECT jsonb_object_agg(activity_date, 
                jsonb_build_object(
                    'sessions', sessions,
                    'completed', completed,
                    'totalMinutes', total_mins,
                    'completedMinutes', completed_mins
                )
            ) FROM daily_activity
        ) as activity_by_day
    FROM public.user_stats us
    WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard data (anonymized)
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    rank INTEGER,
    username VARCHAR(50),
    completed_sessions INTEGER,
    completed_minutes INTEGER,
    current_streak INTEGER,
    completion_rate DECIMAL(5,2)
) AS $$
BEGIN
    -- Set context for RLS
    PERFORM set_rls_context('leaderboard');
    
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY us.completed_sessions DESC, us.completed_minutes DESC)::INTEGER as rank,
        CASE 
            WHEN u.username IS NULL THEN 'Anonymous'
            ELSE LEFT(u.username, 1) || REPEAT('*', LENGTH(u.username) - 1)
        END as username,
        us.completed_sessions,
        us.completed_minutes,
        us.streak_days as current_streak,
        us.completion_rate
    FROM public.user_stats us
    LEFT JOIN public.users u ON us.user_id = u.id
    WHERE us.completed_sessions > 0
    ORDER BY us.completed_sessions DESC, us.completed_minutes DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;