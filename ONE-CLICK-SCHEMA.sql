-- =====================================================================================
-- 🚀 ONE-CLICK SUPABASE SCHEMA FOR POMODORO TIMER
-- Copy and paste this ENTIRE script into Supabase Dashboard → SQL Editor → RUN
-- =====================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- 1. USERS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- =====================================================================================
-- 2. USER PREFERENCES TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    default_pomodoro_length INTEGER DEFAULT 25,
    break_length INTEGER DEFAULT 5,
    weekly_goal INTEGER DEFAULT 140,
    theme VARCHAR(20) DEFAULT 'light',
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================================================
-- 3. USER STATS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0,
    monthly_stats JSONB DEFAULT '{}',
    daily_stats JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================================================
-- 4. POMODORO SESSIONS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Pomodoro Session',
    duration INTEGER DEFAULT 25,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'expired')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- 5. MEETINGS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team')),
    max_participants INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- 6. MEETING PARTICIPANTS TABLE (COLLABORATION FEATURE)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.meeting_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(meeting_id, user_id)
);

-- =====================================================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_is_active ON public.pomodoro_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON public.meeting_participants(user_id);

-- =====================================================================================
-- 8. ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- 9. RLS POLICIES
-- =====================================================================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can manage own stats" ON public.user_stats
    FOR ALL USING (auth.uid() = user_id);

-- Pomodoro sessions policies
CREATE POLICY "Users can manage own sessions" ON public.pomodoro_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Meetings policies (with collaboration support)
CREATE POLICY "Users can view accessible meetings" ON public.meetings
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT mp.user_id FROM public.meeting_participants mp
            WHERE mp.meeting_id = meetings.id
        ) OR
        visibility = 'public'
    );

CREATE POLICY "Users can create own meetings" ON public.meetings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Meeting owners can update meetings" ON public.meetings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Meeting owners can delete meetings" ON public.meetings
    FOR DELETE USING (auth.uid() = user_id);

-- Meeting participants policies (collaboration)
CREATE POLICY "Users can view meeting participants" ON public.meeting_participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT m.user_id FROM public.meetings m
            WHERE m.id = meeting_participants.meeting_id
        )
    );

CREATE POLICY "Meeting owners can manage participants" ON public.meeting_participants
    FOR ALL USING (
        auth.uid() IN (
            SELECT m.user_id FROM public.meetings m
            WHERE m.id = meeting_participants.meeting_id
        )
    );

CREATE POLICY "Users can respond to invitations" ON public.meeting_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================================================
-- 10. FUNCTIONS AND TRIGGERS
-- =====================================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user preferences and stats
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default user preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);

    -- Create default user stats
    INSERT INTO public.user_stats (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create defaults when user is created
CREATE TRIGGER create_user_defaults_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_user_defaults();

-- =====================================================================================
-- 🎉 SCHEMA CREATION COMPLETE!
-- =====================================================================================

-- Verify installation
SELECT
    'Schema created successfully! Tables:' as status,
    string_agg(table_name, ', ') as tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'user_preferences', 'user_stats', 'pomodoro_sessions', 'meetings', 'meeting_participants');

-- Show table count
SELECT
    COUNT(*) as total_tables,
    'Expected: 6 tables (users, user_preferences, user_stats, pomodoro_sessions, meetings, meeting_participants)' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'user_preferences', 'user_stats', 'pomodoro_sessions', 'meetings', 'meeting_participants');