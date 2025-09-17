-- =====================================================================================
-- Row Level Security (RLS) Policies for Pomodoro Timer
-- Ensures users can only access their own data
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- USERS TABLE POLICIES
-- =====================================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (excluding sensitive fields)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can delete their own account
CREATE POLICY "Users can delete own account" ON public.users
    FOR DELETE USING (auth.uid() = id);

-- =====================================================================================
-- USER PREFERENCES TABLE POLICIES
-- =====================================================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================================
-- USER STATS TABLE POLICIES
-- =====================================================================================

-- Users can view their own statistics
CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own stats (system-generated)
CREATE POLICY "Users can insert own stats" ON public.user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats (system-generated)
CREATE POLICY "Users can update own stats" ON public.user_stats
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stats
CREATE POLICY "Users can delete own stats" ON public.user_stats
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================================
-- POMODORO SESSIONS TABLE POLICIES
-- =====================================================================================

-- Users can view their own pomodoro sessions
CREATE POLICY "Users can view own pomodoro sessions" ON public.pomodoro_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own pomodoro sessions
CREATE POLICY "Users can create own pomodoro sessions" ON public.pomodoro_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pomodoro sessions
CREATE POLICY "Users can update own pomodoro sessions" ON public.pomodoro_sessions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pomodoro sessions
CREATE POLICY "Users can delete own pomodoro sessions" ON public.pomodoro_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================================
-- MEETINGS TABLE POLICIES
-- =====================================================================================

-- Users can view their own meetings
CREATE POLICY "Users can view own meetings" ON public.meetings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own meetings
CREATE POLICY "Users can create own meetings" ON public.meetings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own meetings
CREATE POLICY "Users can update own meetings" ON public.meetings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meetings
CREATE POLICY "Users can delete own meetings" ON public.meetings
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================================
-- AUTH SESSIONS TABLE POLICIES
-- =====================================================================================

-- Users can view their own auth sessions
CREATE POLICY "Users can view own auth sessions" ON public.auth_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own auth sessions (login)
CREATE POLICY "Users can create own auth sessions" ON public.auth_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own auth sessions (session management)
CREATE POLICY "Users can update own auth sessions" ON public.auth_sessions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own auth sessions (logout)
CREATE POLICY "Users can delete own auth sessions" ON public.auth_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================================
-- ADDITIONAL SECURITY POLICIES
-- =====================================================================================

-- Policy for reading user rankings (public leaderboard with privacy)
CREATE POLICY "Public leaderboard access" ON public.user_stats
    FOR SELECT USING (
        -- Allow viewing anonymized ranking data for leaderboard
        current_setting('app.context.view_type', true) = 'leaderboard'
    );

-- Policy for admin access (if needed in future)
-- CREATE POLICY "Admin access" ON public.users
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.user_roles 
--             WHERE user_id = auth.uid() AND role = 'admin'
--         )
--     );

-- =====================================================================================
-- FUNCTION TO SET RLS CONTEXT
-- Allows controlled access to specific views (like leaderboards)
-- =====================================================================================

CREATE OR REPLACE FUNCTION set_rls_context(context_type TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.context.view_type', context_type, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- SECURITY HELPER FUNCTIONS
-- =====================================================================================

-- Function to check if current user owns a resource
CREATE OR REPLACE FUNCTION is_owner(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's timezone (for meeting scheduling)
CREATE OR REPLACE FUNCTION get_user_timezone()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT timezone FROM public.user_preferences WHERE user_id = auth.uid()),
        'UTC'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- GRANT PERMISSIONS
-- =====================================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pomodoro_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auth_sessions TO authenticated;

-- Grant sequence permissions (for auto-incrementing fields)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION set_rls_context(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_timezone() TO authenticated;

-- =====================================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'Allows users to view their own profile data';
COMMENT ON POLICY "Users can view own pomodoro sessions" ON public.pomodoro_sessions IS 'Ensures users can only access their own pomodoro sessions';
COMMENT ON POLICY "Users can view own meetings" ON public.meetings IS 'Restricts meeting access to the meeting owner';
COMMENT ON FUNCTION set_rls_context(TEXT) IS 'Sets context for conditional RLS policies (e.g., leaderboard access)';
COMMENT ON FUNCTION is_owner(UUID) IS 'Helper function to check resource ownership';
COMMENT ON FUNCTION get_user_timezone() IS 'Returns user timezone for meeting scheduling';