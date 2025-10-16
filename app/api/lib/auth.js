/**
 * Authentication helper functions for API routes
 */
import { supabase } from './supabase';

/**
 * Validate authentication token
 * @param {Request} request - Next.js request object
 * @returns {Promise<{isValid: boolean, userId?: string, error?: string}>}
 */
export async function validateAuth(request) {
  const token = request.headers.get('x-user-token') ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { isValid: false, error: 'No authentication token provided' };
  }

  try {
    // Check if token exists in auth_sessions
    const { data: session, error } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return { isValid: false, error: 'Invalid or expired token' };
    }

    return { isValid: true, userId: session.user_id, session };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { isValid: false, error: 'Authentication error' };
  }
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
