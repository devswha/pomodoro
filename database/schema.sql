-- =====================================================================================
-- Supabase PostgreSQL Schema for Pomodoro Timer v4.0.0
-- Migration from localStorage to cloud database
-- =====================================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean migrations)
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.pomodoro_sessions CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.auth_sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================================================
-- 1. USERS TABLE
-- Core user authentication and profile data
-- =====================================================================================
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 1 AND char_length(username) <= 50),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 100)
);

-- =====================================================================================
-- 2. USER PREFERENCES TABLE
-- User-specific pomodoro and app preferences
-- =====================================================================================
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one preferences record per user
    UNIQUE(user_id)
);

-- =====================================================================================
-- 3. USER STATISTICS TABLE
-- Comprehensive user performance and activity statistics
-- =====================================================================================
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
    monthly_stats JSONB DEFAULT '{}',
    daily_stats JSONB DEFAULT '{}',
    tags JSONB DEFAULT '{}',
    locations JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one stats record per user
    UNIQUE(user_id)
);

-- =====================================================================================
-- 4. POMODORO SESSIONS TABLE
-- Individual pomodoro session records
-- =====================================================================================
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_end_time CHECK (end_time > start_time),
    CONSTRAINT valid_completed_time CHECK (completed_at IS NULL OR completed_at >= start_time),
    CONSTRAINT valid_stopped_time CHECK (stopped_at IS NULL OR stopped_at >= start_time),
    CONSTRAINT only_one_active_per_user EXCLUDE (user_id WITH =) WHERE (is_active = TRUE)
);

-- =====================================================================================
-- 5. MEETINGS TABLE
-- User meeting scheduling and management
-- =====================================================================================
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT future_or_current_date CHECK (meeting_date >= CURRENT_DATE - INTERVAL '1 day')
);

-- =====================================================================================
-- 6. AUTH SESSIONS TABLE
-- User authentication session management
-- =====================================================================================
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
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

-- =====================================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================================

-- Users table indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_last_login ON public.users(last_login);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- User stats indexes
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);
CREATE INDEX idx_user_stats_last_session_date ON public.user_stats(last_session_date);

-- Pomodoro sessions indexes
CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_status ON public.pomodoro_sessions(status);
CREATE INDEX idx_pomodoro_sessions_is_active ON public.pomodoro_sessions(is_active);
CREATE INDEX idx_pomodoro_sessions_start_time ON public.pomodoro_sessions(start_time);
CREATE INDEX idx_pomodoro_sessions_created_at ON public.pomodoro_sessions(created_at);
CREATE INDEX idx_pomodoro_sessions_user_status ON public.pomodoro_sessions(user_id, status);
CREATE INDEX idx_pomodoro_sessions_user_date ON public.pomodoro_sessions(user_id, DATE(start_time));

-- Meetings indexes
CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX idx_meetings_user_date ON public.meetings(user_id, meeting_date);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_datetime ON public.meetings(meeting_date, meeting_time);

-- Auth sessions indexes
CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token ON public.auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_active ON public.auth_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);
CREATE INDEX idx_auth_sessions_user_active ON public.auth_sessions(user_id, is_active) WHERE is_active = TRUE;

-- =====================================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================================

COMMENT ON TABLE public.users IS 'Core user authentication and profile data';
COMMENT ON TABLE public.user_preferences IS 'User-specific pomodoro and application preferences';
COMMENT ON TABLE public.user_stats IS 'Comprehensive user performance and activity statistics';
COMMENT ON TABLE public.pomodoro_sessions IS 'Individual pomodoro session records and history';
COMMENT ON TABLE public.meetings IS 'User meeting scheduling and management';
COMMENT ON TABLE public.auth_sessions IS 'User authentication session management and security';

COMMENT ON COLUMN public.users.password_hash IS 'PBKDF2-SHA256 hashed password';
COMMENT ON COLUMN public.users.password_salt IS 'Cryptographic salt for password hashing';
COMMENT ON COLUMN public.user_stats.monthly_stats IS 'JSON aggregated monthly statistics';
COMMENT ON COLUMN public.user_stats.daily_stats IS 'JSON aggregated daily statistics';
COMMENT ON COLUMN public.user_stats.tags IS 'JSON aggregated tag usage statistics';
COMMENT ON COLUMN public.user_stats.locations IS 'JSON aggregated location usage statistics';
COMMENT ON COLUMN public.pomodoro_sessions.is_active IS 'Ensures only one active session per user';
COMMENT ON COLUMN public.auth_sessions.session_token IS 'Unique session identifier for authentication';