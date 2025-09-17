/**
 * Pomodoro Sessions API Endpoint
 * GET /api/sessions - Get user's Pomodoro sessions
 * POST /api/sessions - Create a new Pomodoro session
 * 
 * Manages Pomodoro sessions for authenticated users.
 */

import { supabaseAdmin, TABLES } from '../../../lib/supabase/client.js';
import { createSessionSchema, sessionQuerySchema, validateSchema } from '../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendValidationError,
  createPaginationMeta,
  validateMethod,
  withErrorHandling
} from '../../../lib/utils/api-response.js';
import { requireAuth } from '../../../lib/middleware/auth.js';

async function getSessionsHandler(req, res) {
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

  // Validate query parameters
  const validation = validateSchema(sessionQuerySchema, req.query || {});
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const { page, limit, status, startDate, endDate, tags } = validation.data;
    
    let query = supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('start_time', `${startDate}T00:00:00`);
    }

    if (endDate) {
      query = query.lte('start_time', `${endDate}T23:59:59`);
    }

    if (tags) {
      query = query.ilike('tags', `%${tags}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .range(from, to)
      .order('start_time', { ascending: false });

    const { data: sessions, count, error } = await query;

    if (error) {
      console.error('Failed to get sessions:', error);
      return sendError(res, 'Failed to retrieve sessions', 500);
    }

    const paginationMeta = createPaginationMeta(page, limit, count);

    return sendSuccess(res, sessions, 'Sessions retrieved successfully', 200, paginationMeta);

  } catch (error) {
    console.error('Get sessions error:', error);
    return sendError(res, 'Failed to retrieve sessions', 500);
  }
}

async function createSessionHandler(req, res) {
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
  const validation = validateSchema(createSessionSchema, req.body);
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const sessionData = validation.data;

    // Check if user has an active session
    const { data: activeSession } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (activeSession) {
      return sendError(res, 'You already have an active session. Please complete or stop it first.', 409);
    }

    // Calculate start and end times
    const now = new Date();
    let startTime;
    
    if (sessionData.scheduledTime) {
      const scheduled = new Date(sessionData.scheduledTime);
      startTime = scheduled > now ? scheduled : now;
    } else {
      startTime = now;
    }

    const durationMs = sessionData.duration * 60 * 1000; // Convert minutes to milliseconds
    const endTime = new Date(startTime.getTime() + durationMs);

    // Create the session
    const newSession = {
      user_id: userId,
      title: sessionData.title,
      goal: sessionData.goal || null,
      tags: sessionData.tags || null,
      location: sessionData.location || null,
      duration: sessionData.duration,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: startTime > now ? 'scheduled' : 'active',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: createdSession, error } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .insert(newSession)
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return sendError(res, 'Failed to create session', 500);
    }

    // Update user stats for new session
    await updateUserStatsForNewSession(userId, createdSession);

    return sendSuccess(res, createdSession, 'Session created successfully', 201);

  } catch (error) {
    console.error('Create session error:', error);
    return sendError(res, 'Failed to create session', 500);
  }
}

// Helper function to update user stats when a new session is created
async function updateUserStatsForNewSession(userId, session) {
  try {
    // Get current stats
    const { data: currentStats } = await supabaseAdmin
      .from(TABLES.USER_STATS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentStats) {
      // Create initial stats
      await supabaseAdmin
        .from(TABLES.USER_STATS)
        .insert({
          user_id: userId,
          total_sessions: 1,
          completed_sessions: 0,
          total_minutes: session.duration,
          completed_minutes: 0,
          streak_days: 0,
          longest_streak: 0,
          weekly_goal: 140,
          completion_rate: 0,
          average_session_length: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    } else {
      // Update existing stats
      const updatedStats = {
        total_sessions: currentStats.total_sessions + 1,
        total_minutes: currentStats.total_minutes + session.duration,
        updated_at: new Date().toISOString(),
      };

      // Recalculate completion rate
      if (updatedStats.total_sessions > 0) {
        updatedStats.completion_rate = Math.round(
          (currentStats.completed_sessions / updatedStats.total_sessions) * 100
        );
      }

      await supabaseAdmin
        .from(TABLES.USER_STATS)
        .update(updatedStats)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Failed to update user stats:', error);
    // Don't fail the session creation if stats update fails
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getSessionsHandler);
export const POST = withErrorHandling(createSessionHandler);