-- =====================================================================================
-- Complete Supabase Database Setup for Pomodoro Timer v4.0.0
-- Execute this file to set up the entire database system
-- =====================================================================================

-- Set session configuration
SET client_min_messages = NOTICE;
SET log_statement = 'all';

-- Start transaction for atomic setup
BEGIN;

\echo ''
\echo '====================================================================================='
\echo 'POMODORO TIMER v4.0.0 - SUPABASE DATABASE SETUP'
\echo '====================================================================================='
\echo 'Setting up complete database schema, security, and optimization...'
\echo ''

-- =====================================================================================
-- STEP 1: ENABLE EXTENSIONS
-- =====================================================================================

\echo 'Step 1: Enabling PostgreSQL extensions...'

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

\echo 'Extensions enabled successfully.'

-- =====================================================================================
-- STEP 2: CREATE SCHEMA
-- =====================================================================================

\echo 'Step 2: Creating database schema...'

-- Drop existing tables if they exist (for clean migrations)
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.pomodoro_sessions CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_algorithm VARCHAR(50) DEFAULT 'PBKDF2-SHA256',
    password_iterations INTEGER DEFAULT 100000,
    
    avatar TEXT,
    bio TEXT DEFAULT '',
    email_verified BOOLEAN DEFAULT FALSE,
    
    login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT FALSE,
    lock_count INTEGER DEFAULT 0,
    last_login TIMESTAMPTZ,
    ip_address INET,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT username_length CHECK (char_length(username) >= 1 AND char_length(username) <= 50),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 100)
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    default_pomodoro_length INTEGER DEFAULT 25 CHECK (default_pomodoro_length BETWEEN 1 AND 120),
    break_length INTEGER DEFAULT 5 CHECK (break_length BETWEEN 1 AND 60),
    long_break_length INTEGER DEFAULT 15 CHECK (long_break_length BETWEEN 1 AND 120),
    weekly_goal INTEGER DEFAULT 140 CHECK (weekly_goal >= 0),
    
    theme VARCHAR(20) DEFAULT 'default',
    sound_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    auto_start_break BOOLEAN DEFAULT FALSE,
    auto_start_pomodoro BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create user stats table
CREATE TABLE public.user_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    completed_sessions INTEGER DEFAULT 0 CHECK (completed_sessions >= 0),
    total_minutes INTEGER DEFAULT 0 CHECK (total_minutes >= 0),
    completed_minutes INTEGER DEFAULT 0 CHECK (completed_minutes >= 0),
    
    streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_session_date DATE,
    
    completion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_rate BETWEEN 0 AND 100),
    average_session_length DECIMAL(8,2) DEFAULT 0.00 CHECK (average_session_length >= 0),
    
    monthly_stats JSONB DEFAULT '{}',
    daily_stats JSONB DEFAULT '{}',
    tags JSONB DEFAULT '{}',
    locations JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create pomodoro sessions table
CREATE TABLE public.pomodoro_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL DEFAULT 'Pomodoro Session',
    goal TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 240),
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    scheduled_time TIMESTAMPTZ,
    
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'active', 'completed', 'stopped', 'paused')),
    is_active BOOLEAN DEFAULT FALSE,
    
    session_type VARCHAR(20) DEFAULT 'pomodoro' 
        CHECK (session_type IN ('pomodoro', 'short_break', 'long_break')),
    interruptions INTEGER DEFAULT 0 CHECK (interruptions >= 0),
    notes TEXT DEFAULT '',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_end_time CHECK (end_time > start_time),
    CONSTRAINT valid_completed_time CHECK (completed_at IS NULL OR completed_at >= start_time),
    CONSTRAINT valid_stopped_time CHECK (stopped_at IS NULL OR stopped_at >= start_time),
    CONSTRAINT only_one_active_per_user EXCLUDE (user_id WITH =) WHERE (is_active = TRUE)
);

-- Create meetings table
CREATE TABLE public.meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    duration INTEGER DEFAULT 60 CHECK (duration BETWEEN 1 AND 1440),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    meeting_type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    
    participants TEXT[] DEFAULT '{}',
    agenda TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    
    external_id VARCHAR(255),
    meeting_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT future_or_current_date CHECK (meeting_date >= CURRENT_DATE - INTERVAL '1 day')
);

-- Create auth sessions table
CREATE TABLE public.auth_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    session_token VARCHAR(128) UNIQUE NOT NULL,
    refresh_token VARCHAR(128) UNIQUE,
    
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    is_active BOOLEAN DEFAULT TRUE,
    remember_me BOOLEAN DEFAULT FALSE,
    invalidated_at TIMESTAMPTZ,
    invalidation_reason VARCHAR(100),
    
    login_method VARCHAR(50) DEFAULT 'password',
    session_duration INTERVAL,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at),
    CONSTRAINT valid_last_activity CHECK (last_activity >= created_at)
);

\echo 'Database schema created successfully.'

-- =====================================================================================
-- STEP 3: CREATE INDEXES
-- =====================================================================================

\echo 'Step 3: Creating performance indexes...'

-- Basic indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);

CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_status ON public.pomodoro_sessions(status);
CREATE INDEX idx_pomodoro_sessions_is_active ON public.pomodoro_sessions(is_active);
CREATE INDEX idx_pomodoro_sessions_start_time ON public.pomodoro_sessions(start_time);
CREATE INDEX idx_pomodoro_sessions_user_status ON public.pomodoro_sessions(user_id, status);

CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX idx_meetings_user_date ON public.meetings(user_id, meeting_date);

CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON public.auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_active ON public.auth_sessions(is_active) WHERE is_active = TRUE;

-- Composite indexes for common queries
CREATE INDEX idx_pomodoro_sessions_user_status_date ON public.pomodoro_sessions(user_id, status, DATE(start_time));
CREATE INDEX idx_pomodoro_sessions_user_active_start ON public.pomodoro_sessions(user_id, is_active, start_time) WHERE is_active = TRUE;

\echo 'Indexes created successfully.'

-- =====================================================================================
-- STEP 4: CREATE FUNCTIONS AND TRIGGERS
-- =====================================================================================

\echo 'Step 4: Creating functions and triggers...'

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
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

-- User initialization function
CREATE OR REPLACE FUNCTION initialize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id) 
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_stats (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize user data
CREATE OR REPLACE FUNCTION trigger_initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_user_data(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION trigger_initialize_user_data();

-- Statistics update function
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
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        SUM(duration),
        SUM(duration) FILTER (WHERE status = 'completed'),
        MAX(DATE(start_time))
    INTO v_total_sessions, v_completed_sessions, v_total_minutes, v_completed_minutes, v_last_session_date
    FROM public.pomodoro_sessions 
    WHERE user_id = p_user_id;
    
    v_total_sessions := COALESCE(v_total_sessions, 0);
    v_completed_sessions := COALESCE(v_completed_sessions, 0);
    v_total_minutes := COALESCE(v_total_minutes, 0);
    v_completed_minutes := COALESCE(v_completed_minutes, 0);
    
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Session management functions
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
    v_start_time := COALESCE(p_scheduled_time, NOW());
    v_end_time := v_start_time + (p_duration || ' minutes')::INTERVAL;
    
    UPDATE public.pomodoro_sessions 
    SET is_active = FALSE, status = 'stopped', stopped_at = NOW()
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    INSERT INTO public.pomodoro_sessions (
        user_id, title, goal, tags, location, duration,
        start_time, end_time, scheduled_time, status, is_active
    ) VALUES (
        p_user_id, p_title, p_goal, p_tags, p_location, p_duration,
        v_start_time, v_end_time, p_scheduled_time, 'active', TRUE
    ) RETURNING id INTO v_session_id;
    
    PERFORM update_user_statistics(p_user_id);
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_pomodoro_session(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_session_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.pomodoro_sessions 
        WHERE id = p_session_id AND user_id = p_user_id AND is_active = TRUE
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.pomodoro_sessions SET
        status = 'completed',
        is_active = FALSE,
        completed_at = NOW()
    WHERE id = p_session_id AND user_id = p_user_id;
    
    PERFORM update_user_statistics(p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

\echo 'Functions and triggers created successfully.'

-- =====================================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================================================

\echo 'Step 5: Enabling Row Level Security...'

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pomodoro sessions" ON public.pomodoro_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meetings" ON public.meetings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own auth sessions" ON public.auth_sessions
    FOR ALL USING (auth.uid() = user_id);

\echo 'Row Level Security enabled successfully.'

-- =====================================================================================
-- STEP 6: GRANT PERMISSIONS
-- =====================================================================================

\echo 'Step 6: Setting up permissions...'

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

\echo 'Permissions granted successfully.'

-- =====================================================================================
-- STEP 7: CREATE SAMPLE DATA (Optional)
-- =====================================================================================

\echo 'Step 7: Creating sample data...'

-- Insert sample user (for testing)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO public.users (
        username, display_name, email, password_hash, password_salt,
        password_algorithm, created_at
    ) VALUES (
        'demo_user',
        'Demo User',
        'demo@pomodoro-timer.com',
        'demo_password_hash',
        'demo_salt',
        'demo_algorithm',
        NOW()
    ) RETURNING id INTO v_user_id;
    
    -- Sample preferences and stats will be created by trigger
    
    RAISE NOTICE 'Sample user created with ID: %', v_user_id;
END $$;

\echo 'Sample data created successfully.'

-- =====================================================================================
-- STEP 8: VALIDATION
-- =====================================================================================

\echo 'Step 8: Validating setup...'

-- Validate tables
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    IF table_count >= 6 THEN
        RAISE NOTICE 'All tables created successfully: % tables found', table_count;
    ELSE
        RAISE WARNING 'Expected 6 tables, found %', table_count;
    END IF;
END $$;

-- Validate functions
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    
    RAISE NOTICE 'Functions created: %', function_count;
END $$;

-- Validate RLS
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true;
    
    IF rls_count >= 6 THEN
        RAISE NOTICE 'RLS enabled on all tables: % tables secured', rls_count;
    ELSE
        RAISE WARNING 'RLS not enabled on all tables: % of 6 secured', rls_count;
    END IF;
END $$;

\echo 'Validation completed successfully.'

-- Commit the transaction
COMMIT;

\echo ''
\echo '====================================================================================='
\echo 'SETUP COMPLETED SUCCESSFULLY!'
\echo '====================================================================================='
\echo ''
\echo 'Database Features Installed:'
\echo '- ✅ Complete normalized schema with proper relationships'
\echo '- ✅ Row Level Security (RLS) for data isolation'
\echo '- ✅ Performance indexes for optimal queries'
\echo '- ✅ Automated triggers for data consistency'
\echo '- ✅ User management and session functions'
\echo '- ✅ Statistics calculation and aggregation'
\echo '- ✅ Proper constraints and validations'
\echo ''
\echo 'Next Steps:'
\echo '1. Configure Supabase project settings'
\echo '2. Set up authentication providers'
\echo '3. Configure environment variables'
\echo '4. Implement client-side integration'
\echo '5. Migrate existing localStorage data'
\echo ''
\echo 'Sample Functions Available:'
\echo '- start_pomodoro_session(user_id, title, goal, tags, location, duration)'
\echo '- complete_pomodoro_session(user_id, session_id)'
\echo '- update_user_statistics(user_id)'
\echo '- initialize_user_data(user_id)'
\echo ''
\echo 'For detailed migration guide, see: database/supabase-setup.md'
\echo '====================================================================================='