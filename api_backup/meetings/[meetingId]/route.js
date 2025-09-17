/**
 * Individual Meeting API Endpoint
 * GET /api/meetings/[meetingId] - Get specific meeting
 * PUT /api/meetings/[meetingId] - Update meeting
 * DELETE /api/meetings/[meetingId] - Delete meeting
 * 
 * Manages individual meetings.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { updateMeetingSchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendNotFound,
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getMeetingHandler(req, res) {
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
    const { meetingId } = req.params;

    const { data: meeting, error } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('id', meetingId)
      .eq('user_id', userId) // Ensure user can only access their own meetings
      .single();

    if (error || !meeting) {
      return sendNotFound(res, 'Meeting not found');
    }

    return sendSuccess(res, meeting);

  } catch (error) {
    console.error('Get meeting error:', error);
    return sendError(res, 'Failed to retrieve meeting', 500);
  }
}

async function updateMeetingHandler(req, res) {
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
  const validation = validateSchema(updateMeetingSchema, req.body);
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const updates = validation.data;

    // Check if meeting exists and belongs to user
    const { data: existingMeeting, error: fetchError } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('id', meetingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingMeeting) {
      return sendNotFound(res, 'Meeting not found');
    }

    // Check for time conflicts if date or time is being updated
    if ((updates.date || updates.time) && 
        (updates.date !== existingMeeting.date || updates.time !== existingMeeting.time)) {
      
      const checkDate = updates.date || existingMeeting.date;
      const checkTime = updates.time || existingMeeting.time;
      
      const { data: conflictingMeetings } = await supabaseAdmin
        .from(TABLES.MEETINGS)
        .select('id, title')
        .eq('user_id', userId)
        .eq('date', checkDate)
        .eq('time', checkTime)
        .neq('id', meetingId);

      if (conflictingMeetings && conflictingMeetings.length > 0) {
        return sendError(res, 'A meeting already exists at this time', 409, {
          conflictingMeeting: conflictingMeetings[0]
        });
      }
    }

    // Update the meeting
    const { data: updatedMeeting, error: updateError } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update meeting:', updateError);
      return sendError(res, 'Failed to update meeting', 500);
    }

    return sendSuccess(res, updatedMeeting, 'Meeting updated successfully');

  } catch (error) {
    console.error('Update meeting error:', error);
    return sendError(res, 'Failed to update meeting', 500);
  }
}

async function deleteMeetingHandler(req, res) {
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
    const { meetingId } = req.params;

    // Check if meeting exists and belongs to user
    const { data: existingMeeting, error: fetchError } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('id', meetingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingMeeting) {
      return sendNotFound(res, 'Meeting not found');
    }

    // Delete the meeting
    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .delete()
      .eq('id', meetingId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete meeting:', deleteError);
      return sendError(res, 'Failed to delete meeting', 500);
    }

    return sendSuccess(res, null, 'Meeting deleted successfully');

  } catch (error) {
    console.error('Delete meeting error:', error);
    return sendError(res, 'Failed to delete meeting', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getMeetingHandler);
export const PUT = withErrorHandling(updateMeetingHandler);
export const DELETE = withErrorHandling(deleteMeetingHandler);