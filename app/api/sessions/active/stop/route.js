/**
 * Stop Active Session API Endpoint
 * POST /api/sessions/active/stop - Stop the active session
 * 
 * Stops the user's active session without marking it as completed.
 */

import { supabaseAdmin, TABLES } from '../../../../../lib/supabase/client.js';
import { 
  sendSuccess, 
  sendError,
  sendNotFound,
  validateMethod,
  withErrorHandling
} from '../../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../../lib/middleware/auth.js';

async function stopSessionHandler(req, res) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['POST'])) return;

  // Apply authentication middleware
  await new Promise((resolve, reject) => {
    requireAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!supabaseAdmin) {
    return sendError(res, 'Database access not available', 503);
  }

  try {
    const userId = req.userId;

    // Find the active session
    const { data: activeSession, error: findError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (findError || !activeSession) {
      return sendNotFound(res, 'No active session found to stop');
    }

    // Mark session as stopped
    const now = new Date();
    const { data: stoppedSession, error: updateError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .update({
        status: 'stopped',
        stopped_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to stop session:', updateError);
      return sendError(res, 'Failed to stop session', 500);
    }

    return sendSuccess(res, stoppedSession, 'Session stopped successfully');

  } catch (error) {
    console.error('Stop session error:', error);
    return sendError(res, 'Failed to stop session', 500);
  }
}

// Named exports for App Router
export const POST = withErrorHandling(stopSessionHandler);