/**
 * User Logout API Endpoint
 * POST /api/auth/logout
 * 
 * Signs out user from Supabase and invalidates session.
 */

import { supabase } from '../../../../lib/supabase/client.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';
import { 
  sendSuccess, 
  sendError, 
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';

async function logoutHandler(req, res) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    // Get the access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendSuccess(res, null, 'Already logged out');
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    // Sign out from Supabase
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('Logout error:', error);
      // Don't fail if logout fails - client should clear tokens anyway
    }

    return sendSuccess(res, null, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails on server, we should return success
    // so client clears its tokens
    return sendSuccess(res, null, 'Logout completed');
  }
}

// Named exports for App Router
export const POST = withErrorHandling(logoutHandler);