/**
 * User Registration API Endpoint
 * POST /api/auth/register
 * 
 * Registers a new user with Supabase authentication and creates user profile.
 */

import { supabase, supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { registerSchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError, 
  sendConflict, 
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';

async function registerHandler(req) {
  // Get request body for Next.js App Router
  const body = await req.json();

  // Validate request body
  const validation = validateSchema(registerSchema, body);
  if (!validation.success) {
    return sendValidationError(null, validation.errors);
  }

  const { username, email, password, displayName } = validation.data;

  try {
    // Check if username is already taken (check our users table)
    if (supabaseAdmin) {
      const { data: existingUser } = await supabaseAdmin
        .from(TABLES.USERS)
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        return sendConflict(null, 'Username already exists');
      }
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: displayName || username,
        }
      }
    });

    if (authError) {
      // Handle specific Supabase auth errors
      if (authError.message.includes('already registered')) {
        return sendConflict(null, 'Email already registered');
      }
      
      return sendError(null, authError.message, 400);
    }

    const user = authData.user;
    if (!user) {
      return sendError(null, 'User registration failed', 500);
    }

    // Create user profile in our database (if we have admin access)
    if (supabaseAdmin) {
      const { error: profileError } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          id: user.id,
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          display_name: displayName || username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        // Don't fail registration if profile creation fails
        // The profile can be created later via webhook or manual process
      }

      // Initialize user preferences
      await supabaseAdmin
        .from(TABLES.USER_PREFERENCES)
        .insert({
          user_id: user.id,
          default_pomodoro_length: 25,
          break_length: 5,
          long_break_length: 15,
          weekly_goal: 140,
          theme: 'default',
          sound_enabled: true,
          notifications_enabled: true,
          auto_start_break: false,
          auto_start_pomodoro: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Initialize user stats
      await supabaseAdmin
        .from(TABLES.USER_STATS)
        .insert({
          user_id: user.id,
          total_sessions: 0,
          completed_sessions: 0,
          total_minutes: 0,
          completed_minutes: 0,
          streak_days: 0,
          longest_streak: 0,
          weekly_goal: 140,
          completion_rate: 0,
          average_session_length: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    const response = {
      user: {
        id: user.id,
        email: user.email,
        username: username.toLowerCase(),
        displayName: displayName || username,
        emailConfirmed: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
      },
      session: authData.session,
      message: user.email_confirmed_at 
        ? 'Registration successful' 
        : 'Registration successful. Please check your email to verify your account.'
    };

    return sendSuccess(null, response, response.message, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return sendError(null, 'Registration failed', 500);
  }
}

// Named exports for App Router
export const POST = registerHandler;