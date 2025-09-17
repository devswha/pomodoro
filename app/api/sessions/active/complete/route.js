/**
 * Complete Active Session API Endpoint
 * POST /api/sessions/active/complete - Complete the active session
 * 
 * Marks the user's active session as completed and updates statistics.
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

async function completeSessionHandler(req, res) {
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
      return sendNotFound(res, 'No active session found to complete');
    }

    // Mark session as completed
    const now = new Date();
    const { data: completedSession, error: updateError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .update({
        status: 'completed',
        completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to complete session:', updateError);
      return sendError(res, 'Failed to complete session', 500);
    }

    // Update user statistics
    await updateUserStatsForCompletion(userId, completedSession);

    return sendSuccess(res, completedSession, 'Session completed successfully');

  } catch (error) {
    console.error('Complete session error:', error);
    return sendError(res, 'Failed to complete session', 500);
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

    if (!currentStats) {
      // Create initial stats if they don't exist
      await supabaseAdmin
        .from(TABLES.USER_STATS)
        .insert({
          user_id: userId,
          total_sessions: 1,
          completed_sessions: 1,
          total_minutes: session.duration,
          completed_minutes: session.duration,
          streak_days: 1,
          longest_streak: 1,
          last_session_date: new Date().toISOString().split('T')[0],
          weekly_goal: 140,
          completion_rate: 100,
          average_session_length: session.duration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      return;
    }

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

    // Update streak logic
    const today = new Date().toISOString().split('T')[0];
    const lastSessionDate = currentStats.last_session_date;
    
    if (!lastSessionDate || lastSessionDate !== today) {
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
          // Streak broken - reset to 1
          updatedStats.streak_days = 1;
        }
      } else {
        // First session ever
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

  } catch (error) {
    console.error('Failed to update completion stats:', error);
    // Don't fail the completion if stats update fails
  }
}

// Named exports for App Router
export const POST = withErrorHandling(completeSessionHandler);