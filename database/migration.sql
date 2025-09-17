-- =====================================================================================
-- Migration Script: localStorage to Supabase PostgreSQL
-- Complete migration for Pomodoro Timer v4.0.0
-- =====================================================================================

-- =====================================================================================
-- STEP 1: SETUP AND PREREQUISITES
-- =====================================================================================

-- Set session variables for migration
SET client_min_messages = WARNING;
SET log_statement = 'none';

-- Create backup schema for safety
DROP SCHEMA IF EXISTS migration_backup CASCADE;
CREATE SCHEMA migration_backup;

-- =====================================================================================
-- STEP 2: EXECUTE SCHEMA CREATION
-- =====================================================================================

\echo 'Creating database schema...'
\i schema.sql

\echo 'Setting up Row Level Security policies...'
\i rls-policies.sql

\echo 'Installing functions and triggers...'
\i functions.sql

-- =====================================================================================
-- STEP 3: SAMPLE DATA MIGRATION HELPERS
-- =====================================================================================

-- Function to migrate user data from localStorage format
CREATE OR REPLACE FUNCTION migrate_user_from_localstorage(
    p_user_data JSONB
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_username VARCHAR(50);
    v_email VARCHAR(255);
    v_password_hash TEXT;
BEGIN
    -- Extract user data
    v_username := p_user_data->>'id';
    v_email := p_user_data->>'email';
    v_password_hash := p_user_data->>'password'; -- Simple password for migration
    
    -- Create user
    INSERT INTO public.users (
        username, display_name, email, password_hash, password_salt,
        password_algorithm, password_iterations, avatar, bio,
        email_verified, created_at, last_login
    ) VALUES (
        v_username,
        COALESCE(p_user_data->>'displayName', v_username),
        v_email,
        v_password_hash, -- In production, this should be properly hashed
        'migration_salt', -- Placeholder salt
        'migration_simple', -- Mark as needing password update
        1, -- Minimal iterations for migration
        p_user_data->>'avatar',
        COALESCE(p_user_data->>'bio', ''),
        COALESCE((p_user_data->>'emailVerified')::BOOLEAN, FALSE),
        COALESCE((p_user_data->>'createdAt')::TIMESTAMPTZ, NOW()),
        (p_user_data->>'lastLogin')::TIMESTAMPTZ
    ) RETURNING id INTO v_user_id;
    
    -- Migrate user preferences if they exist
    IF p_user_data ? 'preferences' THEN
        INSERT INTO public.user_preferences (
            user_id, default_pomodoro_length, break_length, long_break_length,
            weekly_goal, theme, sound_enabled, notifications_enabled,
            auto_start_break, auto_start_pomodoro
        ) VALUES (
            v_user_id,
            COALESCE((p_user_data->'preferences'->>'defaultPomodoroLength')::INTEGER, 25),
            COALESCE((p_user_data->'preferences'->>'breakLength')::INTEGER, 5),
            COALESCE((p_user_data->'preferences'->>'longBreakLength')::INTEGER, 15),
            COALESCE((p_user_data->'preferences'->>'weeklyGoal')::INTEGER, 140),
            COALESCE(p_user_data->'preferences'->>'theme', 'default'),
            COALESCE((p_user_data->'preferences'->>'soundEnabled')::BOOLEAN, TRUE),
            COALESCE((p_user_data->'preferences'->>'notificationsEnabled')::BOOLEAN, TRUE),
            COALESCE((p_user_data->'preferences'->>'autoStartBreak')::BOOLEAN, FALSE),
            COALESCE((p_user_data->'preferences'->>'autoStartPomodoro')::BOOLEAN, FALSE)
        ) ON CONFLICT (user_id) DO UPDATE SET
            default_pomodoro_length = EXCLUDED.default_pomodoro_length,
            break_length = EXCLUDED.break_length,
            long_break_length = EXCLUDED.long_break_length,
            weekly_goal = EXCLUDED.weekly_goal,
            theme = EXCLUDED.theme,
            sound_enabled = EXCLUDED.sound_enabled,
            notifications_enabled = EXCLUDED.notifications_enabled,
            auto_start_break = EXCLUDED.auto_start_break,
            auto_start_pomodoro = EXCLUDED.auto_start_pomodoro;
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate user statistics from localStorage format
CREATE OR REPLACE FUNCTION migrate_user_stats_from_localstorage(
    p_user_id UUID,
    p_stats_data JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_stats (
        user_id, total_sessions, completed_sessions, total_minutes, completed_minutes,
        streak_days, longest_streak, last_session_date, weekly_goal,
        monthly_stats, daily_stats, tags, locations, completion_rate, average_session_length
    ) VALUES (
        p_user_id,
        COALESCE((p_stats_data->>'totalSessions')::INTEGER, 0),
        COALESCE((p_stats_data->>'completedSessions')::INTEGER, 0),
        COALESCE((p_stats_data->>'totalMinutes')::INTEGER, 0),
        COALESCE((p_stats_data->>'completedMinutes')::INTEGER, 0),
        COALESCE((p_stats_data->>'streakDays')::INTEGER, 0),
        COALESCE((p_stats_data->>'longestStreak')::INTEGER, 0),
        (p_stats_data->>'lastSessionDate')::DATE,
        COALESCE((p_stats_data->>'weeklyGoal')::INTEGER, 140),
        COALESCE(p_stats_data->'monthlyStats', '{}'::JSONB),
        COALESCE(p_stats_data->'dailyStats', '{}'::JSONB),
        COALESCE(p_stats_data->'tags', '{}'::JSONB),
        COALESCE(p_stats_data->'locations', '{}'::JSONB),
        COALESCE((p_stats_data->>'completionRate')::DECIMAL(5,2), 0.00),
        COALESCE((p_stats_data->>'averageSessionLength')::DECIMAL(8,2), 0.00)
    ) ON CONFLICT (user_id) DO UPDATE SET
        total_sessions = EXCLUDED.total_sessions,
        completed_sessions = EXCLUDED.completed_sessions,
        total_minutes = EXCLUDED.total_minutes,
        completed_minutes = EXCLUDED.completed_minutes,
        streak_days = EXCLUDED.streak_days,
        longest_streak = EXCLUDED.longest_streak,
        last_session_date = EXCLUDED.last_session_date,
        weekly_goal = EXCLUDED.weekly_goal,
        monthly_stats = EXCLUDED.monthly_stats,
        daily_stats = EXCLUDED.daily_stats,
        tags = EXCLUDED.tags,
        locations = EXCLUDED.locations,
        completion_rate = EXCLUDED.completion_rate,
        average_session_length = EXCLUDED.average_session_length;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate pomodoro sessions from localStorage format
CREATE OR REPLACE FUNCTION migrate_pomodoro_sessions_from_localstorage(
    p_user_id UUID,
    p_sessions_data JSONB
)
RETURNS VOID AS $$
DECLARE
    session_record JSONB;
BEGIN
    -- Loop through each session in the array
    FOR session_record IN SELECT jsonb_array_elements(p_sessions_data)
    LOOP
        INSERT INTO public.pomodoro_sessions (
            user_id, title, goal, tags, location, duration,
            start_time, end_time, completed_at, stopped_at,
            status, is_active, session_type, notes, created_at
        ) VALUES (
            p_user_id,
            COALESCE(session_record->>'title', 'Pomodoro Session'),
            COALESCE(session_record->>'goal', ''),
            COALESCE(session_record->>'tags', ''),
            COALESCE(session_record->>'location', ''),
            COALESCE((session_record->>'duration')::INTEGER, 25),
            (session_record->>'startTime')::TIMESTAMPTZ,
            (session_record->>'endTime')::TIMESTAMPTZ,
            (session_record->>'completedAt')::TIMESTAMPTZ,
            (session_record->>'stoppedAt')::TIMESTAMPTZ,
            COALESCE(session_record->>'status', 'completed'),
            FALSE, -- No sessions should be active during migration
            'pomodoro',
            COALESCE(session_record->>'notes', ''),
            COALESCE((session_record->>'createdAt')::TIMESTAMPTZ, NOW())
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate meetings from localStorage format
CREATE OR REPLACE FUNCTION migrate_meetings_from_localstorage(
    p_user_id UUID,
    p_meetings_data JSONB
)
RETURNS VOID AS $$
DECLARE
    meeting_record JSONB;
BEGIN
    -- Loop through each meeting in the array
    FOR meeting_record IN SELECT jsonb_array_elements(p_meetings_data)
    LOOP
        INSERT INTO public.meetings (
            user_id, title, description, location, meeting_date, meeting_time,
            duration, status, agenda, notes, created_at, updated_at
        ) VALUES (
            p_user_id,
            meeting_record->>'title',
            COALESCE(meeting_record->>'description', ''),
            COALESCE(meeting_record->>'location', ''),
            (meeting_record->>'date')::DATE,
            (meeting_record->>'time')::TIME,
            COALESCE((meeting_record->>'duration')::INTEGER, 60),
            COALESCE(meeting_record->>'status', 'scheduled'),
            COALESCE(meeting_record->>'agenda', ''),
            COALESCE(meeting_record->>'notes', ''),
            COALESCE((meeting_record->>'createdAt')::TIMESTAMPTZ, NOW()),
            COALESCE((meeting_record->>'updatedAt')::TIMESTAMPTZ, NOW())
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- STEP 4: SAMPLE MIGRATION SCRIPT
-- =====================================================================================

-- Example migration function (to be customized based on actual localStorage data)
CREATE OR REPLACE FUNCTION perform_sample_migration()
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_migration_report TEXT := '';
BEGIN
    -- Example migration of sample user data
    -- In practice, this would be replaced with actual localStorage data extraction
    
    \echo 'Starting sample data migration...'
    
    -- Migrate sample user
    v_user_id := migrate_user_from_localstorage('{
        "id": "testuser",
        "displayName": "Test User",
        "email": "test@example.com",
        "password": "testpassword",
        "createdAt": "2024-01-01T00:00:00Z",
        "preferences": {
            "defaultPomodoroLength": 25,
            "breakLength": 5,
            "weeklyGoal": 140,
            "theme": "default",
            "soundEnabled": true
        }
    }'::JSONB);
    
    v_migration_report := v_migration_report || 'Migrated user: ' || v_user_id::TEXT || E'\n';
    
    -- Migrate sample stats
    PERFORM migrate_user_stats_from_localstorage(v_user_id, '{
        "totalSessions": 50,
        "completedSessions": 40,
        "totalMinutes": 1250,
        "completedMinutes": 1000,
        "streakDays": 7,
        "longestStreak": 14,
        "completionRate": 80.00,
        "averageSessionLength": 25.00
    }'::JSONB);
    
    v_migration_report := v_migration_report || 'Migrated stats for user: ' || v_user_id::TEXT || E'\n';
    
    -- Migrate sample sessions
    PERFORM migrate_pomodoro_sessions_from_localstorage(v_user_id, '[
        {
            "title": "Study Session",
            "goal": "Complete chapter 5",
            "tags": "study,math",
            "location": "Library",
            "duration": 25,
            "startTime": "2024-01-01T10:00:00Z",
            "endTime": "2024-01-01T10:25:00Z",
            "status": "completed",
            "createdAt": "2024-01-01T10:00:00Z"
        }
    ]'::JSONB);
    
    v_migration_report := v_migration_report || 'Migrated sessions for user: ' || v_user_id::TEXT || E'\n';
    
    RETURN v_migration_report;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- STEP 5: VALIDATION AND VERIFICATION
-- =====================================================================================

-- Function to validate migration integrity
CREATE OR REPLACE FUNCTION validate_migration()
RETURNS TABLE(
    table_name TEXT,
    record_count INTEGER,
    validation_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'users'::TEXT,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
    FROM public.users
    
    UNION ALL
    
    SELECT 
        'user_preferences'::TEXT,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
    FROM public.user_preferences
    
    UNION ALL
    
    SELECT 
        'user_stats'::TEXT,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
    FROM public.user_stats
    
    UNION ALL
    
    SELECT 
        'pomodoro_sessions'::TEXT,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
    FROM public.pomodoro_sessions
    
    UNION ALL
    
    SELECT 
        'meetings'::TEXT,
        COUNT(*)::INTEGER,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'EMPTY' END::TEXT
    FROM public.meetings;
END;
$$ LANGUAGE plpgsql;

-- Function to check foreign key constraints
CREATE OR REPLACE FUNCTION check_referential_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_preferences_fk'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'VIOLATION' END::TEXT,
        'Orphaned preferences: ' || COUNT(*)::TEXT
    FROM public.user_preferences up
    LEFT JOIN public.users u ON up.user_id = u.id
    WHERE u.id IS NULL
    
    UNION ALL
    
    SELECT 
        'user_stats_fk'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'VIOLATION' END::TEXT,
        'Orphaned stats: ' || COUNT(*)::TEXT
    FROM public.user_stats us
    LEFT JOIN public.users u ON us.user_id = u.id
    WHERE u.id IS NULL
    
    UNION ALL
    
    SELECT 
        'pomodoro_sessions_fk'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'VIOLATION' END::TEXT,
        'Orphaned sessions: ' || COUNT(*)::TEXT
    FROM public.pomodoro_sessions ps
    LEFT JOIN public.users u ON ps.user_id = u.id
    WHERE u.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- STEP 6: POST-MIGRATION TASKS
-- =====================================================================================

-- Function to optimize database after migration
CREATE OR REPLACE FUNCTION post_migration_optimization()
RETURNS TEXT AS $$
BEGIN
    -- Update table statistics
    ANALYZE public.users;
    ANALYZE public.user_preferences;
    ANALYZE public.user_stats;
    ANALYZE public.pomodoro_sessions;
    ANALYZE public.meetings;
    ANALYZE public.auth_sessions;
    
    -- Recompute statistics for all users
    PERFORM update_user_statistics(id) FROM public.users;
    
    RETURN 'Post-migration optimization completed successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- MIGRATION EXECUTION SUMMARY
-- =====================================================================================

\echo ''
\echo '====================================================================================='
\echo 'MIGRATION SETUP COMPLETED'
\echo '====================================================================================='
\echo ''
\echo 'To complete the migration:'
\echo '1. Execute: SELECT perform_sample_migration(); -- For sample data'
\echo '2. Execute: SELECT * FROM validate_migration(); -- Validate migration'
\echo '3. Execute: SELECT * FROM check_referential_integrity(); -- Check constraints'
\echo '4. Execute: SELECT post_migration_optimization(); -- Optimize database'
\echo ''
\echo 'For production migration:'
\echo '1. Export localStorage data to JSON format'
\echo '2. Use migration functions with actual data'
\echo '3. Validate data integrity'
\echo '4. Update application to use Supabase'
\echo ''
\echo '====================================================================================='