/**
 * Meetings API Endpoint
 * GET /api/meetings - Get user's meetings
 * POST /api/meetings - Create a new meeting
 * 
 * Manages meeting schedules for authenticated users.
 */

import { supabaseAdmin, TABLES } from '../../../lib/supabase/client.js';
import { createMeetingSchema, meetingQuerySchema, validateSchema } from '../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendValidationError,
  createPaginationMeta,
  validateMethod,
  withErrorHandling
} from '../../../lib/utils/api-response.js';
import { requireAuth } from '../../../lib/middleware/auth.js';

async function getMeetingsHandler(req, res) {
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
  const validation = validateSchema(meetingQuerySchema, req.query || {});
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const { date, startDate, endDate, type, priority } = validation.data;
    
    let query = supabaseAdmin
      .from(TABLES.MEETINGS)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (date) {
      query = query.eq('date', date);
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (startDate) {
      query = query.gte('date', startDate);
    } else if (endDate) {
      query = query.lte('date', endDate);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Order by date and time
    query = query.order('date', { ascending: true }).order('time', { ascending: true });

    const { data: meetings, count, error } = await query;

    if (error) {
      console.error('Failed to get meetings:', error);
      return sendError(res, 'Failed to retrieve meetings', 500);
    }

    return sendSuccess(res, meetings, 'Meetings retrieved successfully');

  } catch (error) {
    console.error('Get meetings error:', error);
    return sendError(res, 'Failed to retrieve meetings', 500);
  }
}

async function createMeetingHandler(req, res) {
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
  const validation = validateSchema(createMeetingSchema, req.body);
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const meetingData = validation.data;

    // Check for time conflicts
    const { data: conflictingMeetings } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .select('id, title, time')
      .eq('user_id', userId)
      .eq('date', meetingData.date)
      .eq('time', meetingData.time);

    if (conflictingMeetings && conflictingMeetings.length > 0) {
      return sendError(res, 'A meeting already exists at this time', 409, {
        conflictingMeeting: conflictingMeetings[0]
      });
    }

    // Create the meeting
    const now = new Date();
    const newMeeting = {
      user_id: userId,
      title: meetingData.title,
      description: meetingData.description || null,
      date: meetingData.date,
      time: meetingData.time,
      duration: meetingData.duration,
      location: meetingData.location || null,
      participants: meetingData.participants || [],
      type: meetingData.type,
      priority: meetingData.priority,
      reminder_minutes: meetingData.reminderMinutes,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: createdMeeting, error } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .insert(newMeeting)
      .select()
      .single();

    if (error) {
      console.error('Failed to create meeting:', error);
      return sendError(res, 'Failed to create meeting', 500);
    }

    return sendSuccess(res, createdMeeting, 'Meeting created successfully', 201);

  } catch (error) {
    console.error('Create meeting error:', error);
    return sendError(res, 'Failed to create meeting', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getMeetingsHandler);
export const POST = withErrorHandling(createMeetingHandler);