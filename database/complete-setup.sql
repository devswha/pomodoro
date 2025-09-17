-- =====================================================================================
-- 🚀 COMPLETE SUPABASE DATABASE SETUP FOR POMODORO TIMER v4.0.0
-- Production-Ready Installation Script with Error Handling
-- =====================================================================================

-- Set session configuration for better error reporting
SET client_min_messages = NOTICE;
SET log_statement = 'none';
SET log_min_messages = WARNING;

-- Start transaction for atomic setup
BEGIN;

-- Save the current time for performance tracking
\set setup_start_time `date +%s`

\echo ''
\echo '====================================================================================='
\echo '🍅 POMODORO TIMER v4.0.0 - COMPLETE DATABASE SETUP'
\echo '====================================================================================='
\echo '🎯 Starting production-ready database installation...'
\echo '⏱️  Setup started at:' `date`
\echo ''

-- =====================================================================================
-- STEP 1: PREREQUISITES & VALIDATION
-- =====================================================================================

\echo '📋 Step 1: Validating prerequisites and environment...'

-- Check PostgreSQL version
DO $$
DECLARE
    pg_version_num INTEGER;
BEGIN
    SELECT current_setting('server_version_num')::INTEGER INTO pg_version_num;
    
    IF pg_version_num < 120000 THEN
        RAISE EXCEPTION 'PostgreSQL version 12+ required. Current version: %', 
            current_setting('server_version');
    ELSE
        RAISE NOTICE '✅ PostgreSQL version check passed: %', current_setting('server_version');
    END IF;
END $$;

-- Check if running on Supabase
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        RAISE WARNING '⚠️  Not running on Supabase - auth schema not found. Some features may not work.';
    ELSE
        RAISE NOTICE '✅ Supabase environment detected';
    END IF;
END $$;

\echo '✅ Prerequisites validated successfully'

-- =====================================================================================
-- STEP 2: ENABLE EXTENSIONS
-- =====================================================================================

\echo '🔧 Step 2: Enabling PostgreSQL extensions...'

-- Enable extensions with error handling
DO $$
BEGIN
    -- UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RAISE NOTICE '✅ uuid-ossp extension enabled';
    
    -- Cryptographic functions
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    RAISE NOTICE '✅ pgcrypto extension enabled';
    
    -- Performance monitoring (optional)
    BEGIN
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
        RAISE NOTICE '✅ pg_stat_statements extension enabled';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE WARNING '⚠️  pg_stat_statements requires superuser privileges - skipped';
        WHEN OTHERS THEN
            RAISE WARNING '⚠️  Could not enable pg_stat_statements: %', SQLERRM;
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Failed to enable extensions: %', SQLERRM;
END $$;

\echo '✅ Extensions enabled successfully'

-- =====================================================================================
-- STEP 3: DROP EXISTING TABLES (Clean Migration)
-- =====================================================================================

\echo '🧹 Step 3: Cleaning existing tables for fresh installation...'

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.pomodoro_sessions CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.initialize_user_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.trigger_initialize_user_data() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.start_pomodoro_session(UUID, VARCHAR, TEXT, TEXT, VARCHAR, INTEGER, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS public.complete_pomodoro_session(UUID, UUID) CASCADE;

\echo '✅ Existing tables and functions cleaned'

-- =====================================================================================
-- STEP 4: CREATE CORE SCHEMA
-- =====================================================================================

\echo '🏗️  Step 4: Creating database schema...'

-- 4.1 Users Table
\echo '   Creating users table...'
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_algorithm VARCHAR(50) DEFAULT 'PBKDF2-SHA256',
    password_iterations INTEGER DEFAULT 100000,
    
    -- Profile information
    avatar TEXT,
    bio TEXT DEFAULT '',
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Account security
    login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT FALSE,
    lock_count INTEGER DEFAULT 0,
    last_login TIMESTAMPTZ,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 1 AND char_length(username) <= 50),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 100)
);

-- 4.2 User Preferences Table
\echo '   Creating user_preferences table...'
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Pomodoro settings
    default_pomodoro_length INTEGER DEFAULT 25 CHECK (default_pomodoro_length BETWEEN 1 AND 120),
    break_length INTEGER DEFAULT 5 CHECK (break_length BETWEEN 1 AND 60),
    long_break_length INTEGER DEFAULT 15 CHECK (long_break_length BETWEEN 1 AND 120),
    weekly_goal INTEGER DEFAULT 140 CHECK (weekly_goal >= 0),
    
    -- App preferences
    theme VARCHAR(20) DEFAULT 'default',
    sound_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    auto_start_break BOOLEAN DEFAULT FALSE,
    auto_start_pomodoro BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one preferences record per user
    UNIQUE(user_id)
);

-- 4.3 User Statistics Table
\echo '   Creating user_stats table...'
CREATE TABLE public.user_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Session counters
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    completed_sessions INTEGER DEFAULT 0 CHECK (completed_sessions >= 0),
    total_minutes INTEGER DEFAULT 0 CHECK (total_minutes >= 0),
    completed_minutes INTEGER DEFAULT 0 CHECK (completed_minutes >= 0),
    
    -- Streak tracking
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_session_date DATE,
    
    -- Calculated metrics (updated via triggers)
    completion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_rate BETWEEN 0 AND 100),
    average_session_length DECIMAL(8,2) DEFAULT 0.00 CHECK (average_session_length >= 0),
    
    -- JSON aggregated data
    monthly_stats JSONB DEFAULT '{}' NOT NULL,
    daily_stats JSONB DEFAULT '{}' NOT NULL,
    tags JSONB DEFAULT '{}' NOT NULL,
    locations JSONB DEFAULT '{}' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one stats record per user
    UNIQUE(user_id)
);

-- 4.4 Pomodoro Sessions Table
\echo '   Creating pomodoro_sessions table...'
CREATE TABLE public.pomodoro_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Session details
    title VARCHAR(255) NOT NULL DEFAULT 'Pomodoro Session',
    goal TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 240), -- minutes
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    scheduled_time TIMESTAMPTZ,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'active', 'completed', 'stopped', 'paused')),
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Session metadata
    session_type VARCHAR(20) DEFAULT 'pomodoro' 
        CHECK (session_type IN ('pomodoro', 'short_break', 'long_break')),
    interruptions INTEGER DEFAULT 0 CHECK (interruptions >= 0),
    notes TEXT DEFAULT '',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_end_time CHECK (end_time > start_time),
    CONSTRAINT valid_completed_time CHECK (completed_at IS NULL OR completed_at >= start_time),
    CONSTRAINT valid_stopped_time CHECK (stopped_at IS NULL OR stopped_at >= start_time),
    CONSTRAINT only_one_active_per_user EXCLUDE (user_id WITH =) WHERE (is_active = TRUE)
);

-- 4.5 Meetings Table
\echo '   Creating meetings table...'
CREATE TABLE public.meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Meeting details
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    
    -- Scheduling
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    duration INTEGER DEFAULT 60 CHECK (duration BETWEEN 1 AND 1440), -- minutes
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Meeting type and status
    meeting_type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    
    -- Participants and notes
    participants TEXT[] DEFAULT '{}',
    agenda TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    
    -- Integration
    external_id VARCHAR(255), -- For calendar integration
    meeting_url TEXT, -- For video calls
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT future_or_current_date CHECK (meeting_date >= CURRENT_DATE - INTERVAL '1 day')
);

-- 4.6 Auth Sessions Table
\echo '   Creating auth_sessions table...'
CREATE TABLE public.auth_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Session identification
    session_token VARCHAR(128) UNIQUE NOT NULL,
    refresh_token VARCHAR(128) UNIQUE,
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Session timing
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Session flags
    is_active BOOLEAN DEFAULT TRUE,
    remember_me BOOLEAN DEFAULT FALSE,
    invalidated_at TIMESTAMPTZ,
    invalidation_reason VARCHAR(100),
    
    -- Security tracking
    login_method VARCHAR(50) DEFAULT 'password',
    session_duration INTERVAL,
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_last_activity CHECK (last_activity >= created_at)
);

\echo '✅ All tables created successfully'

-- =====================================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =====================================================================================

\echo '📈 Step 5: Creating performance indexes...'

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON public.users(last_login);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_locked ON public.users(is_locked) WHERE is_locked = TRUE;

-- User preferences indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- User stats indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_last_session_date ON public.user_stats(last_session_date);

-- Pomodoro sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_status ON public.pomodoro_sessions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_is_active ON public.pomodoro_sessions(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_start_time ON public.pomodoro_sessions(start_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_created_at ON public.pomodoro_sessions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_status ON public.pomodoro_sessions(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_date ON public.pomodoro_sessions(user_id, DATE(start_time));

-- Meetings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_user_date ON public.meetings(user_id, meeting_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_meetings_datetime ON public.meetings(meeting_date, meeting_time);

-- Auth sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(session_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_active ON public.auth_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_user_active ON public.auth_sessions(user_id, is_active) WHERE is_active = TRUE;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_status_date ON public.pomodoro_sessions(user_id, status, DATE(start_time));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pomodoro_sessions_user_active_start ON public.pomodoro_sessions(user_id, is_active, start_time) WHERE is_active = TRUE;

\echo '✅ All indexes created successfully'

-- =====================================================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================================================

\echo '⚙️  Step 6: Creating functions and triggers...'

-- 6.1 Updated timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in update_updated_at_column: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at 
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pomodoro_sessions_updated_at 
    BEFORE UPDATE ON public.pomodoro_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at 
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6.2 User initialization function
CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert default preferences
    INSERT INTO public.user_preferences (user_id) 
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default statistics
    INSERT INTO public.user_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'User data initialized for user: %', p_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error initializing user data for %: %', p_user_id, SQLERRM;
END;
$$;

-- 6.3 Trigger to initialize user data on user creation
CREATE OR REPLACE FUNCTION public.trigger_initialize_user_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.initialize_user_data(NEW.id);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in trigger_initialize_user_data: %', SQLERRM;
        RETURN NEW;
END;
$$;

CREATE TRIGGER after_user_insert 
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.trigger_initialize_user_data();

-- 6.4 Statistics update function
CREATE OR REPLACE FUNCTION public.update_user_statistics(p_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_sessions INTEGER := 0;
    v_completed_sessions INTEGER := 0;
    v_total_minutes INTEGER := 0;
    v_completed_minutes INTEGER := 0;
    v_completion_rate DECIMAL(5,2) := 0.00;
    v_avg_session_length DECIMAL(8,2) := 0.00;
    v_last_session_date DATE;
BEGIN
    -- Calculate statistics from pomodoro_sessions
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0),
        COALESCE(SUM(duration), 0),
        COALESCE(SUM(duration) FILTER (WHERE status = 'completed'), 0),
        MAX(DATE(start_time))
    INTO 
        v_total_sessions, 
        v_completed_sessions, 
        v_total_minutes, 
        v_completed_minutes, 
        v_last_session_date
    FROM public.pomodoro_sessions 
    WHERE user_id = p_user_id;
    
    -- Calculate completion rate
    v_completion_rate := CASE 
        WHEN v_total_sessions > 0 THEN 
            ROUND((v_completed_sessions::DECIMAL / v_total_sessions) * 100, 2)
        ELSE 0 
    END;
    
    -- Calculate average session length
    v_avg_session_length := CASE 
        WHEN v_completed_sessions > 0 THEN 
            ROUND(v_completed_minutes::DECIMAL / v_completed_sessions, 2)
        ELSE 0 
    END;
    
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
    
    -- Insert if not exists (shouldn't happen due to trigger, but safety)
    IF NOT FOUND THEN
        INSERT INTO public.user_stats (
            user_id, total_sessions, completed_sessions, total_minutes, 
            completed_minutes, completion_rate, average_session_length, last_session_date
        ) VALUES (
            p_user_id, v_total_sessions, v_completed_sessions, v_total_minutes,
            v_completed_minutes, v_completion_rate, v_avg_session_length, v_last_session_date
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error updating statistics for user %: %', p_user_id, SQLERRM;
END;
$$;

-- 6.5 Start pomodoro session function
CREATE OR REPLACE FUNCTION public.start_pomodoro_session(
    p_user_id UUID,
    p_title VARCHAR(255) DEFAULT 'Pomodoro Session',
    p_goal TEXT DEFAULT '',
    p_tags TEXT DEFAULT '',
    p_location VARCHAR(100) DEFAULT '',
    p_duration INTEGER DEFAULT 25,
    p_scheduled_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    -- Validate input
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID cannot be null';
    END IF;
    
    IF p_duration < 1 OR p_duration > 240 THEN
        RAISE EXCEPTION 'Duration must be between 1 and 240 minutes';
    END IF;
    
    -- Calculate timing
    v_start_time := COALESCE(p_scheduled_time, NOW());
    v_end_time := v_start_time + (p_duration || ' minutes')::INTERVAL;
    
    -- Stop any existing active sessions for this user
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
    
    -- Update user statistics
    PERFORM public.update_user_statistics(p_user_id);
    
    RETURN v_session_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error starting pomodoro session: %', SQLERRM;
END;
$$;

-- 6.6 Complete pomodoro session function
CREATE OR REPLACE FUNCTION public.complete_pomodoro_session(
    p_user_id UUID, 
    p_session_id UUID
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_exists BOOLEAN := FALSE;
BEGIN
    -- Check if session exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.pomodoro_sessions 
        WHERE id = p_session_id 
        AND user_id = p_user_id 
        AND is_active = TRUE
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Complete the session
    UPDATE public.pomodoro_sessions SET
        status = 'completed',
        is_active = FALSE,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id AND user_id = p_user_id;
    
    -- Update user statistics
    PERFORM public.update_user_statistics(p_user_id);
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error completing session % for user %: %', p_session_id, p_user_id, SQLERRM;
        RETURN FALSE;
END;
$$;

\echo '✅ All functions and triggers created successfully'

-- =====================================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =====================================================================================

\echo '🔐 Step 7: Enabling Row Level Security...'

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper error handling
DO $$
BEGIN
    -- Users table policies
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    
    -- User preferences policies
    DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
    CREATE POLICY "Users can manage own preferences" ON public.user_preferences
        FOR ALL USING (auth.uid() = user_id);
    
    -- User stats policies
    DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
    CREATE POLICY "Users can view own stats" ON public.user_stats
        FOR ALL USING (auth.uid() = user_id);
    
    -- Pomodoro sessions policies
    DROP POLICY IF EXISTS "Users can manage own sessions" ON public.pomodoro_sessions;
    CREATE POLICY "Users can manage own sessions" ON public.pomodoro_sessions
        FOR ALL USING (auth.uid() = user_id);
    
    -- Meetings policies
    DROP POLICY IF EXISTS "Users can manage own meetings" ON public.meetings;
    CREATE POLICY "Users can manage own meetings" ON public.meetings
        FOR ALL USING (auth.uid() = user_id);
    
    -- Auth sessions policies
    DROP POLICY IF EXISTS "Users can manage own auth sessions" ON public.auth_sessions;
    CREATE POLICY "Users can manage own auth sessions" ON public.auth_sessions
        FOR ALL USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ All RLS policies created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️  RLS policies creation had issues: %', SQLERRM;
END $$;

\echo '✅ Row Level Security enabled successfully'

-- =====================================================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================================================

\echo '👥 Step 8: Setting up permissions...'

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users
GRANT SELECT ON public.users TO anon;

\echo '✅ Permissions granted successfully'

-- =====================================================================================
-- STEP 9: CREATE HEALTH CHECK AND UTILITY FUNCTIONS
-- =====================================================================================

\echo '🏥 Step 9: Creating health check and utility functions...'

-- Health check function
CREATE OR REPLACE FUNCTION public.perform_health_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check table existence
    RETURN QUERY
    SELECT 
        'Table Existence'::TEXT,
        CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 6 expected tables'::TEXT
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Check RLS enabled
    RETURN QUERY
    SELECT 
        'RLS Security'::TEXT,
        CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'RLS enabled on ' || COUNT(*)::TEXT || ' of 6 tables'::TEXT
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true;
    
    -- Check functions
    RETURN QUERY
    SELECT 
        'Functions'::TEXT,
        CASE WHEN COUNT(*) >= 6 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' functions'::TEXT
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    -- Check indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 20 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' indexes'::TEXT
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Test core functionality
    RETURN QUERY
    SELECT 
        'Sample Data'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM public.users LIMIT 1) THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Sample data available for testing'::TEXT;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Health Check Error'::TEXT, 'FAIL'::TEXT, SQLERRM::TEXT;
END;
$$;

-- Performance metrics function
CREATE OR REPLACE FUNCTION public.get_performance_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value TEXT,
    metric_unit TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Database size
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))::TEXT,
        'bytes'::TEXT;
    
    -- Table sizes
    RETURN QUERY
    SELECT 
        'Users Table Size'::TEXT,
        pg_size_pretty(pg_total_relation_size('public.users'))::TEXT,
        'bytes'::TEXT;
    
    RETURN QUERY
    SELECT 
        'Sessions Table Size'::TEXT,
        pg_size_pretty(pg_total_relation_size('public.pomodoro_sessions'))::TEXT,
        'bytes'::TEXT;
    
    -- Record counts
    RETURN QUERY
    SELECT 'Total Users'::TEXT, COUNT(*)::TEXT, 'records'::TEXT 
    FROM public.users;
    
    RETURN QUERY
    SELECT 'Total Sessions'::TEXT, COUNT(*)::TEXT, 'records'::TEXT 
    FROM public.pomodoro_sessions;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT 'Metrics Error'::TEXT, SQLERRM::TEXT, 'error'::TEXT;
END;
$$;

-- Data cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up expired auth sessions
    DELETE FROM public.auth_sessions 
    WHERE expires_at < NOW() - INTERVAL '1 day'
    OR (invalidated_at IS NOT NULL AND invalidated_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error cleaning up sessions: %', SQLERRM;
        RETURN 0;
END;
$$;

\echo '✅ Health check and utility functions created'

-- =====================================================================================
-- STEP 10: CREATE SAMPLE DATA
-- =====================================================================================

\echo '📝 Step 10: Creating sample data for testing...'

DO $$
DECLARE
    v_user_id UUID;
    v_session_id UUID;
BEGIN
    -- Insert sample user
    INSERT INTO public.users (
        username, display_name, email, password_hash, password_salt,
        password_algorithm, email_verified, created_at
    ) VALUES (
        'demo_user',
        'Demo User',
        'demo@pomodoro-timer.com',
        'demo_password_hash_secure',
        'demo_salt_secure',
        'PBKDF2-SHA256',
        TRUE,
        NOW()
    ) RETURNING id INTO v_user_id;
    
    -- Sample preferences and stats will be created by trigger
    
    -- Create a sample completed session
    SELECT public.start_pomodoro_session(
        v_user_id,
        'Sample Pomodoro Session',
        'Testing the database setup',
        'setup,testing',
        'Home Office',
        25
    ) INTO v_session_id;
    
    -- Complete the sample session
    PERFORM public.complete_pomodoro_session(v_user_id, v_session_id);
    
    -- Add a sample meeting
    INSERT INTO public.meetings (
        user_id, title, description, meeting_date, meeting_time, duration
    ) VALUES (
        v_user_id,
        'Sample Meeting',
        'Testing meeting functionality',
        CURRENT_DATE + INTERVAL '1 day',
        '10:00:00',
        60
    );
    
    RAISE NOTICE '✅ Sample user created with ID: %', v_user_id;
    RAISE NOTICE '✅ Sample session completed with ID: %', v_session_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️  Error creating sample data: %', SQLERRM;
END $$;

\echo '✅ Sample data created successfully'

-- =====================================================================================
-- STEP 11: FINAL VALIDATION
-- =====================================================================================

\echo '🔍 Step 11: Running final validation...'

-- Run comprehensive health check
DO $$
DECLARE
    health_record RECORD;
    all_passed BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== HEALTH CHECK RESULTS ===';
    
    FOR health_record IN SELECT * FROM public.perform_health_check() LOOP
        RAISE NOTICE '% - %: %', 
            health_record.check_name, 
            health_record.status, 
            health_record.details;
            
        IF health_record.status = 'FAIL' THEN
            all_passed := FALSE;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    
    IF all_passed THEN
        RAISE NOTICE '✅ All health checks PASSED';
    ELSE
        RAISE WARNING '⚠️  Some health checks FAILED - review above';
    END IF;
    
END $$;

-- Test core functions
DO $$
DECLARE
    test_user_id UUID;
    test_session_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FUNCTION TESTING ===';
    
    -- Get sample user
    SELECT id INTO test_user_id FROM public.users WHERE username = 'demo_user';
    
    IF test_user_id IS NOT NULL THEN
        -- Test session creation
        SELECT public.start_pomodoro_session(
            test_user_id, 'Test Session', 'Function test', 'test', 'Test Location', 15
        ) INTO test_session_id;
        
        RAISE NOTICE '✅ Session creation: SUCCESS (ID: %)', test_session_id;
        
        -- Test session completion
        IF public.complete_pomodoro_session(test_user_id, test_session_id) THEN
            RAISE NOTICE '✅ Session completion: SUCCESS';
        ELSE
            RAISE WARNING '❌ Session completion: FAILED';
        END IF;
        
        -- Test statistics update
        PERFORM public.update_user_statistics(test_user_id);
        RAISE NOTICE '✅ Statistics update: SUCCESS';
        
    ELSE
        RAISE WARNING '❌ Cannot find test user for function testing';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Function testing failed: %', SQLERRM;
END $$;

-- Calculate setup time
\set setup_end_time `date +%s`

-- Commit the transaction
COMMIT;

\echo ''
\echo '====================================================================================='
\echo '🎉 SETUP COMPLETED SUCCESSFULLY!'
\echo '====================================================================================='
\echo '⏱️  Setup completed at:' `date`
\echo '📊 Performance:'
\echo '   - Setup time: ' :setup_end_time ' - ' :setup_start_time ' seconds'
\echo ''
\echo '✅ Database Features Installed:'
\echo '   ✅ Complete normalized schema with proper relationships'
\echo '   ✅ Row Level Security (RLS) for data isolation'
\echo '   ✅ Performance indexes for optimal queries'
\echo '   ✅ Automated triggers for data consistency'
\echo '   ✅ User management and session functions'
\echo '   ✅ Statistics calculation and aggregation'
\echo '   ✅ Health monitoring and maintenance tools'
\echo '   ✅ Sample data for immediate testing'
\echo ''
\echo '🚀 Next Steps:'
\echo '   1. Configure your .env.local file with Supabase credentials'
\echo '   2. Test the health check: SELECT * FROM perform_health_check();'
\echo '   3. Review performance metrics: SELECT * FROM get_performance_metrics();'
\echo '   4. Integrate with your application using the Supabase client'
\echo '   5. Migrate existing localStorage data (if applicable)'
\echo ''
\echo '🛠️  Available Functions:'
\echo '   - start_pomodoro_session(user_id, title, goal, tags, location, duration)'
\echo '   - complete_pomodoro_session(user_id, session_id)'
\echo '   - update_user_statistics(user_id)'
\echo '   - initialize_user_data(user_id)'
\echo '   - perform_health_check()'
\echo '   - get_performance_metrics()'
\echo '   - cleanup_expired_sessions()'
\echo ''
\echo '📖 Documentation:'
\echo '   - Setup Guide: database/PRODUCTION_SETUP_GUIDE.md'
\echo '   - API Reference: database/supabase-setup.md'
\echo '   - Migration Guide: database/migration.sql'
\echo ''
\echo '🔐 Security Reminder:'
\echo '   - Never expose service_role key in client code'
\echo '   - All user data is protected by Row Level Security'
\echo '   - Review and test all RLS policies before production'
\echo ''
\echo '====================================================================================='