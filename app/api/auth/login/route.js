/**
 * User Login API Endpoint
 * POST /api/auth/login
 * 
 * Authenticates user with Supabase and returns session tokens.
 */

import { supabase, supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { loginSchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError, 
  sendUnauthorized,
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';

async function loginHandler(req) {
  // Skip method validation for Next.js App Router - handled by file name

  // Get request body for Next.js App Router
  const body = await req.json();

  // Validate request body
  const validation = validateSchema(loginSchema, body);
  if (!validation.success) {
    return sendValidationError(null, validation.errors);
  }

  const { username, password, rememberMe } = validation.data;

  try {
    // First, get the user's email from username
    let email = username;
    
    // If username doesn't look like email, find email by username
    if (!username.includes('@')) {
      if (supabaseAdmin) {
        const { data: userData, error: userError } = await supabaseAdmin
          .from(TABLES.USERS)
          .select('email')
          .eq('username', username.toLowerCase())
          .single();

        if (userError || !userData) {
          return sendUnauthorized(null, 'Invalid username or password');
        }

        email = userData.email;
      } else {
        return sendUnauthorized(null, 'Username login requires database access');
      }
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return sendUnauthorized(null, 'Invalid username or password');
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return sendUnauthorized(null, 'Please verify your email address before logging in');
      }
      
      return sendError(null, authError.message, 400);
    }

    const user = authData.user;
    const session = authData.session;

    if (!user || !session) {
      return sendUnauthorized(null, 'Authentication failed');
    }

    // Update last login timestamp
    if (supabaseAdmin) {
      await supabaseAdmin
        .from(TABLES.USERS)
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    // Get user profile data
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

    const response = {
      user: {
        id: user.id,
        email: user.email,
        username: userProfile?.username || username.toLowerCase(),
        displayName: userProfile?.display_name || user.user_metadata?.display_name || username,
        avatarUrl: userProfile?.avatar_url || user.user_metadata?.avatar_url,
        bio: userProfile?.bio,
        role: userProfile?.role || 'user',
        emailConfirmed: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
        lastLoginAt: userProfile?.last_login_at,
      },
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in,
        expiresAt: session.expires_at,
        tokenType: session.token_type,
      },
      preferences,
      message: 'Login successful'
    };

    return sendSuccess(null, response, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return sendError(null, 'Login failed', 500);
  }
}

// Named exports for App Router
export const POST = loginHandler;