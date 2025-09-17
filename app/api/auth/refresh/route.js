/**
 * Token Refresh API Endpoint
 * POST /api/auth/refresh
 * 
 * Refreshes expired access tokens using refresh token.
 */

import { supabase } from '../../../../lib/supabase/client.js';
import { 
  sendSuccess, 
  sendError,
  sendUnauthorized,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';

async function refreshHandler(req, res) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) return;

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendUnauthorized(res, 'Refresh token required');
    }

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({ 
      refresh_token: refreshToken 
    });

    if (error) {
      if (error.message.includes('invalid_grant')) {
        return sendUnauthorized(res, 'Invalid or expired refresh token');
      }
      
      return sendError(res, error.message, 400);
    }

    if (!data.session || !data.user) {
      return sendUnauthorized(res, 'Failed to refresh session');
    }

    const response = {
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at,
        tokenType: data.session.token_type,
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at ? true : false,
      },
      message: 'Token refreshed successfully'
    };

    return sendSuccess(res, response, response.message);

  } catch (error) {
    console.error('Token refresh error:', error);
    return sendError(res, 'Token refresh failed', 500);
  }
}

// Named exports for App Router
export const POST = withErrorHandling(refreshHandler);