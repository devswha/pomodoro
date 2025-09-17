/**
 * Session Validation API Endpoint
 * GET /api/auth/session
 * 
 * Validates current session and returns user information.
 */

import { supabase, supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';
import { 
  sendSuccess, 
  sendError,
  sendUnauthorized,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';

async function sessionHandler(req, res) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['GET'])) return;

  try {
    // Get the access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendUnauthorized(res, 'Access token required');
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    // Validate the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return sendUnauthorized(res, 'Invalid or expired session');
    }

    // Get complete user profile
    let userProfile = null;
    if (supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from(TABLES.USERS)
        .select(`
          id,
          username,
          display_name,
          email,
          avatar_url,
          bio,
          role,
          created_at,
          updated_at,
          last_login_at
        `)
        .eq('id', user.id)
        .single();

      userProfile = profile;
    }

    // Get user preferences
    let preferences = null;
    if (supabaseAdmin) {
      const { data: prefs } = await supabaseAdmin
        .from(TABLES.USER_PREFERENCES)
        .select('*')
        .eq('user_id', user.id)
        .single();

      preferences = prefs;
    }

    // Get basic user stats
    let stats = null;
    if (supabaseAdmin) {
      const { data: userStats } = await supabaseAdmin
        .from(TABLES.USER_STATS)
        .select(`
          total_sessions,
          completed_sessions,
          total_minutes,
          completed_minutes,
          streak_days,
          longest_streak,
          completion_rate,
          average_session_length
        `)
        .eq('user_id', user.id)
        .single();

      stats = userStats;
    }

    const response = {
      user: {
        id: user.id,
        email: user.email,
        username: userProfile?.username,
        displayName: userProfile?.display_name || user.user_metadata?.display_name,
        avatarUrl: userProfile?.avatar_url || user.user_metadata?.avatar_url,
        bio: userProfile?.bio,
        role: userProfile?.role || 'user',
        emailConfirmed: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
        updatedAt: userProfile?.updated_at,
        lastLoginAt: userProfile?.last_login_at,
      },
      preferences,
      stats,
      sessionValid: true,
      message: 'Session is valid'
    };

    return sendSuccess(res, response, response.message);

  } catch (error) {
    console.error('Session validation error:', error);
    return sendError(res, 'Session validation failed', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(sessionHandler);