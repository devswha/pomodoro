/**
 * Active Pomodoro Session API Endpoint
 * GET /api/sessions/active - Get user's active session
 * POST /api/sessions/active/complete - Mark active session as complete
 * POST /api/sessions/active/stop - Stop active session
 * 
 * Manages the currently active Pomodoro session.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { 
  sendSuccess, 
  sendError,
  sendNotFound,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getActiveSessionHandler(req, res) {
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

    const { data: activeSession, error } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get active session:', error);
      return sendError(res, 'Failed to retrieve active session', 500);
    }

    if (!activeSession) {
      return sendSuccess(res, null, 'No active session found');
    }

    // Check if session should be automatically completed based on end time
    const now = new Date();
    const endTime = new Date(activeSession.end_time);
    
    if (now >= endTime) {
      // Auto-complete the session
      const { data: completedSession, error: completeError } = await supabaseAdmin
        .from(TABLES.POMODORO_SESSIONS)
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', activeSession.id)
        .select()
        .single();

      if (!completeError) {
        // Update user stats for completion
        await updateUserStatsForCompletion(userId, completedSession);
        
        return sendSuccess(res, {
          ...completedSession,
          autoCompleted: true
        }, 'Session auto-completed');
      }
    }

    return sendSuccess(res, activeSession);

  } catch (error) {
    console.error('Get active session error:', error);
    return sendError(res, 'Failed to retrieve active session', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getActiveSessionHandler);

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

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const lastSessionDate = currentStats.last_session_date;
      
      if (!lastSessionDate || lastSessionDate !== today) {
        if (lastSessionDate) {
          const lastDate = new Date(lastSessionDate);
          const todayDate = new Date(today);
          const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            updatedStats.streak_days = currentStats.streak_days + 1;
          } else if (daysDiff === 0) {
            updatedStats.streak_days = currentStats.streak_days;
          } else {
            updatedStats.streak_days = 1;
          }
        } else {
          updatedStats.streak_days = 1;
        }
        
        updatedStats.last_session_date = today;
        
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