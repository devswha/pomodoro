/**
 * Dashboard Overview API Endpoint
 * GET /api/dashboard - Get dashboard overview data
 * 
 * Aggregates all relevant data for the user dashboard including stats, 
 * active session, upcoming meetings, and recent activity.
 */

import { supabaseAdmin, TABLES } from '../../../lib/supabase/client.js';
import { 
  sendSuccess, 
  sendError,
  validateMethod,
  withErrorHandling
} from '../../../lib/utils/api-response.js';
import { requireAuth } from '../../../lib/middleware/auth.js';

async function getDashboardHandler(req, res) {
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
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get all data in parallel for better performance
    const [
      userStatsResult,
      activeSessionResult,
      todaySessionsResult,
      upcomingMeetingsResult,
      weeklySessionsResult
    ] = await Promise.all([
      // User overall stats
      supabaseAdmin
        .from(TABLES.USER_STATS)
        .select('*')
        .eq('user_id', userId)
        .single(),

      // Active Pomodoro session
      supabaseAdmin
        .from(TABLES.POMODORO_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single(),

      // Today's sessions
      supabaseAdmin
        .from(TABLES.POMODORO_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: false }),

      // Upcoming meetings (next 24 hours)
      supabaseAdmin
        .from(TABLES.MEETINGS)
        .select('*')
        .eq('user_id', userId)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(5),

      // This week's sessions for weekly progress
      (() => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        return supabaseAdmin
          .from(TABLES.POMODORO_SESSIONS)
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', `${weekStartStr}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`);
      })()
    ]);

    // Process the results
    const userStats = userStatsResult.data || {
      total_sessions: 0,
      completed_sessions: 0,
      total_minutes: 0,
      completed_minutes: 0,
      streak_days: 0,
      longest_streak: 0,
      weekly_goal: 140,
      completion_rate: 0,
      average_session_length: 0
    };

    const activeSession = activeSessionResult.data;
    const todaySessions = todaySessionsResult.data || [];
    const upcomingMeetings = upcomingMeetingsResult.data || [];
    const weeklySessions = weeklySessionsResult.data || [];

    // Calculate today's stats
    const todayStats = {
      totalSessions: todaySessions.length,
      completedSessions: todaySessions.filter(s => s.status === 'completed').length,
      totalMinutes: todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      completedMinutes: todaySessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration || 0), 0),
      completionRate: todaySessions.length > 0 
        ? Math.round((todaySessions.filter(s => s.status === 'completed').length / todaySessions.length) * 100)
        : 0
    };

    // Calculate weekly progress
    const weeklyProgress = {
      completedMinutes: weeklySessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration || 0), 0),
      goal: userStats.weekly_goal || 140,
      progressPercentage: 0
    };
    weeklyProgress.progressPercentage = weeklyProgress.goal > 0 
      ? Math.round((weeklyProgress.completedMinutes / weeklyProgress.goal) * 100)
      : 0;

    // Process upcoming meetings with time info
    const enrichedMeetings = upcomingMeetings
      .map(meeting => {
        const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
        const minutesUntil = Math.round((meetingDateTime - now) / (1000 * 60));
        
        // Only include meetings that are actually upcoming (not past)
        if (minutesUntil < 0) return null;
        
        return {
          ...meeting,
          minutesUntil,
          hoursUntil: Math.round(minutesUntil / 60),
          isToday: meeting.date === today,
          isSoon: minutesUntil <= (meeting.reminder_minutes || 15),
          timeUntilText: formatTimeUntil(minutesUntil)
        };
      })
      .filter(Boolean)
      .slice(0, 3); // Limit to 3 for dashboard

    // Recent activity (last 7 days of sessions)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: recentSessions } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', weekAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(10);

    // Group recent sessions by day for activity chart
    const activityByDay = {};
    (recentSessions || []).forEach(session => {
      const day = session.start_time.split('T')[0];
      if (!activityByDay[day]) {
        activityByDay[day] = {
          date: day,
          sessions: 0,
          completed: 0,
          minutes: 0
        };
      }
      
      activityByDay[day].sessions++;
      activityByDay[day].minutes += session.duration || 0;
      
      if (session.status === 'completed') {
        activityByDay[day].completed++;
      }
    });

    // Check if active session should be auto-completed
    let processedActiveSession = activeSession;
    if (activeSession) {
      const sessionEndTime = new Date(activeSession.end_time);
      if (now >= sessionEndTime) {
        // Auto-complete the session
        const { data: completedSession } = await supabaseAdmin
          .from(TABLES.POMODORO_SESSIONS)
          .update({
            status: 'completed',
            completed_at: sessionEndTime.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', activeSession.id)
          .select()
          .single();

        processedActiveSession = completedSession ? {
          ...completedSession,
          autoCompleted: true
        } : null;

        // Update stats if auto-completion was successful
        if (completedSession) {
          await updateUserStatsForCompletion(userId, completedSession);
        }
      }
    }

    const dashboardData = {
      user: {
        id: userId,
        // Add more user info if needed from context
      },
      overview: {
        totalSessions: userStats.total_sessions,
        completedSessions: userStats.completed_sessions,
        totalMinutes: userStats.total_minutes,
        completedMinutes: userStats.completed_minutes,
        currentStreak: userStats.streak_days,
        longestStreak: userStats.longest_streak,
        overallCompletionRate: userStats.completion_rate,
        averageSessionLength: userStats.average_session_length,
      },
      today: todayStats,
      weekly: weeklyProgress,
      activeSession: processedActiveSession,
      upcomingMeetings: enrichedMeetings,
      recentActivity: Object.values(activityByDay).sort((a, b) => b.date.localeCompare(a.date)),
      goals: {
        weeklyGoal: userStats.weekly_goal,
        weeklyProgress: weeklyProgress.completedMinutes,
        weeklyProgressPercentage: weeklyProgress.progressPercentage,
        dailyTarget: Math.round(userStats.weekly_goal / 7),
        todayProgress: todayStats.completedMinutes
      }
    };

    return sendSuccess(res, dashboardData);

  } catch (error) {
    console.error('Dashboard error:', error);
    return sendError(res, 'Failed to load dashboard data', 500);
  }
}

// Helper functions
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

      updatedStats.completion_rate = Math.round(
        (updatedStats.completed_sessions / currentStats.total_sessions) * 100
      );

      if (updatedStats.completed_sessions > 0) {
        updatedStats.average_session_length = Math.round(
          updatedStats.completed_minutes / updatedStats.completed_sessions
        );
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

// Named exports for App Router
export const GET = withErrorHandling(getDashboardHandler);