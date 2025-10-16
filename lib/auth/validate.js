import { createClient } from '../supabase/server.js';

export async function validateAuth(req) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'No token provided'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return {
        isValid: false,
        error: 'Invalid or expired token'
      };
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Deactivate expired session
      await supabase
        .from('auth_sessions')
        .update({ is_active: false })
        .eq('id', session.id);

      return {
        isValid: false,
        error: 'Token expired'
      };
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return {
        isValid: false,
        error: 'User not found'
      };
    }

    return {
      isValid: true,
      userId: user.id,
      user,
      session
    };

  } catch (error) {
    console.error('Auth validation error:', error);
    return {
      isValid: false,
      error: 'Authentication failed'
    };
  }
}