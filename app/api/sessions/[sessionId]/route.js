/**
 * Individual Pomodoro Session API Endpoint
 * GET /api/sessions/[sessionId] - Get specific session
 * PUT /api/sessions/[sessionId] - Update session
 * DELETE /api/sessions/[sessionId] - Delete session
 * 
 * Manages individual Pomodoro sessions.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { updateSessionSchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendNotFound,
  sendValidationError,
  sendForbidden,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getSessionHandler(req, res) {
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
    const { sessionId } = req.params;

    const { data: session, error } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId) // Ensure user can only access their own sessions
      .single();

    if (error || !session) {
      return sendNotFound(res, 'Session not found');
    }

    return sendSuccess(res, session);

  } catch (error) {
    console.error('Get session error:', error);
    return sendError(res, 'Failed to retrieve session', 500);
  }
}

async function updateSessionHandler(req, res) {
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

  // Validate request body
  const validation = validateSchema(updateSessionSchema, req.body);
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const updates = validation.data;

    // Check if session exists and belongs to user
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingSession) {
      return sendNotFound(res, 'Session not found');
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return sendError(res, 'Failed to update session', 500);
    }

    // If session status changed to completed, update user stats
    if (updates.status === 'completed' && existingSession.status !== 'completed') {
      await updateUserStatsForCompletion(userId, updatedSession);
    }

    return sendSuccess(res, updatedSession, 'Session updated successfully');

  } catch (error) {
    console.error('Update session error:', error);
    return sendError(res, 'Failed to update session', 500);
  }
}

async function deleteSessionHandler(req, res) {
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
    const { sessionId } = req.params;

    // Check if session exists and belongs to user
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingSession) {
      return sendNotFound(res, 'Session not found');
    }

    // Delete the session
    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete session:', deleteError);
      return sendError(res, 'Failed to delete session', 500);
    }

    // Update user stats to reflect the deletion
    await updateUserStatsAfterDeletion(userId, existingSession);

    return sendSuccess(res, null, 'Session deleted successfully');

  } catch (error) {
    console.error('Delete session error:', error);
    return sendError(res, 'Failed to delete session', 500);
  }
}

// Helper function to update user stats when session is completed
async function updateUserStatsForCompletion(userId, session) {
  try {
    const { data: currentStats } = await supabaseAdmin
      .from(TABLES.USER_STATS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currentStats) {
      const updatedStats = {
        completed_sessions: currentStats.completed_sessions + 1,
        completed_minutes: currentStats.completed_minutes + session.duration,
        updated_at: new Date().toISOString(),
      };

      // Recalculate completion rate
      updatedStats.completion_rate = Math.round(
        (updatedStats.completed_sessions / currentStats.total_sessions) * 100
      );

      // Recalculate average session length
      if (updatedStats.completed_sessions > 0) {
        updatedStats.average_session_length = Math.round(
          updatedStats.completed_minutes / updatedStats.completed_sessions
        );
      }

      // Update streak (simplified - you might want more sophisticated logic)
      const today = new Date().toISOString().split('T')[0];
      const lastSessionDate = currentStats.last_session_date;
      
      if (!lastSessionDate || lastSessionDate !== today) {
        // Check if this maintains the streak
        if (lastSessionDate) {
          const lastDate = new Date(lastSessionDate);
          const todayDate = new Date(today);
          const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Consecutive day - extend streak
            updatedStats.streak_days = currentStats.streak_days + 1;
          } else if (daysDiff === 0) {
            // Same day - maintain streak
            updatedStats.streak_days = currentStats.streak_days;
          } else {
            // Streak broken
            updatedStats.streak_days = 1;
          }
        } else {
          // First session
          updatedStats.streak_days = 1;
        }
        
        updatedStats.last_session_date = today;
        
        // Update longest streak if current streak is longer
        if (updatedStats.streak_days > currentStats.longest_streak) {
          updatedStats.longest_streak = updatedStats.streak_days;
        }
      }

      await supabaseAdmin
        .from(TABLES.USER_STATS)
        .update(updatedStats)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to update completion stats:', error);
  }
}

// Helper function to update user stats when session is deleted
async function updateUserStatsAfterDeletion(userId, deletedSession) {
  try {
    const { data: currentStats } = await supabaseAdmin
      .from(TABLES.USER_STATS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currentStats) {
      const updatedStats = {
        total_sessions: Math.max(0, currentStats.total_sessions - 1),
        total_minutes: Math.max(0, currentStats.total_minutes - deletedSession.duration),
        updated_at: new Date().toISOString(),
      };

      if (deletedSession.status === 'completed') {
        updatedStats.completed_sessions = Math.max(0, currentStats.completed_sessions - 1);
        updatedStats.completed_minutes = Math.max(0, currentStats.completed_minutes - deletedSession.duration);
      }

      // Recalculate completion rate
      if (updatedStats.total_sessions > 0) {
        updatedStats.completion_rate = Math.round(
          (updatedStats.completed_sessions / updatedStats.total_sessions) * 100
        );
      } else {
        updatedStats.completion_rate = 0;
      }

      // Recalculate average session length
      if (updatedStats.completed_sessions > 0) {
        updatedStats.average_session_length = Math.round(
          updatedStats.completed_minutes / updatedStats.completed_sessions
        );
      } else {
        updatedStats.average_session_length = 0;
      }

      await supabaseAdmin
        .from(TABLES.USER_STATS)
        .update(updatedStats)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to update stats after deletion:', error);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getSessionHandler);
export const PUT = withErrorHandling(updateSessionHandler);
export const DELETE = withErrorHandling(deleteSessionHandler);