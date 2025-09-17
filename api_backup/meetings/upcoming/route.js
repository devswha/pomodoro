/**
 * Upcoming Meetings API Endpoint
 * GET /api/meetings/upcoming - Get upcoming meetings
 * 
 * Retrieves upcoming meetings for the authenticated user.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { 
  sendSuccess, 
  sendError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getUpcomingMeetingsHandler(req, res) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['GET'])) return;

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
    const { limit = 5, hours = 24 } = req.query;
    
    // Calculate the time window
    const now = new Date();
    const endTime = new Date(now.getTime() + (parseInt(hours) * 60 * 60 * 1000));
    
    const nowDate = now.toISOString().split('T')[0];
    const nowTime = now.toTimeString().slice(0, 5); // HH:MM format
    const endDate = endTime.toISOString().split('T')[0];
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    // Query for upcoming meetings
    const { data: meetings, error } = await supabaseAdmin
      .from(TABLES.MEETINGS)
      .select('*')
      .eq('user_id', userId)
      .or(`date.gt.${nowDate},and(date.eq.${nowDate},time.gte.${nowTime})`)
      .or(`date.lt.${endDate},and(date.eq.${endDate},time.lte.${endTimeStr})`)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Failed to get upcoming meetings:', error);
      return sendError(res, 'Failed to retrieve upcoming meetings', 500);
    }

    // Filter and enrich meetings with additional info
    const enrichedMeetings = meetings.map(meeting => {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
      const minutesUntil = Math.round((meetingDateTime - now) / (1000 * 60));
      const hoursUntil = Math.round(minutesUntil / 60);
      
      return {
        ...meeting,
        minutesUntil: minutesUntil > 0 ? minutesUntil : 0,
        hoursUntil: hoursUntil > 0 ? hoursUntil : 0,
        isToday: meeting.date === nowDate,
        isSoon: minutesUntil <= meeting.reminder_minutes,
        timeUntilText: formatTimeUntil(minutesUntil)
      };
    });

    return sendSuccess(res, {
      meetings: enrichedMeetings,
      total: enrichedMeetings.length,
      queryInfo: {
        timeWindow: `${hours} hours`,
        from: now.toISOString(),
        to: endTime.toISOString()
      }
    });

  } catch (error) {
    console.error('Get upcoming meetings error:', error);
    return sendError(res, 'Failed to retrieve upcoming meetings', 500);
  }
}

// Helper function to format time until meeting
function formatTimeUntil(minutes) {
  if (minutes < 0) return 'Past due';
  if (minutes === 0) return 'Now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Named exports for App Router
export const GET = withErrorHandling(getUpcomingMeetingsHandler);