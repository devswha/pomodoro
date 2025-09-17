/**
 * User Statistics API Endpoint
 * GET /api/users/stats - Get user statistics
 * 
 * Retrieves comprehensive user statistics for the Pomodoro timer.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { statsQuerySchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { requireAuth } from '../../../../lib/middleware/auth.js';

async function getStatsHandler(req, res) {
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

  // Validate query parameters
  const validation = validateSchema(statsQuerySchema, req.query || {});
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const userId = req.userId;
    const { period, startDate, endDate } = validation.data;

    // Get basic user stats
    const { data: userStats, error: statsError } = await supabaseAdmin
      .from(TABLES.USER_STATS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      console.error('Failed to get user stats:', statsError);
      return sendError(res, 'Failed to retrieve statistics', 500);
    }

    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        start: startDate,
        end: endDate
      };
    } else {
      switch (period) {
        case 'day':
          const today = now.toISOString().split('T')[0];
          dateFilter = { start: today, end: today };
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          dateFilter = {
            start: weekStart.toISOString().split('T')[0],
            end: weekEnd.toISOString().split('T')[0]
          };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          dateFilter = {
            start: monthStart.toISOString().split('T')[0],
            end: monthEnd.toISOString().split('T')[0]
          };
          break;
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const yearEnd = new Date(now.getFullYear(), 11, 31);
          dateFilter = {
            start: yearStart.toISOString().split('T')[0],
            end: yearEnd.toISOString().split('T')[0]
          };
          break;
      }
    }

    // Get sessions for the period
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', `${dateFilter.start}T00:00:00`)
      .lte('start_time', `${dateFilter.end}T23:59:59`)
      .order('start_time', { ascending: false });

    if (sessionsError) {
      console.error('Failed to get sessions:', sessionsError);
      return sendError(res, 'Failed to retrieve session data', 500);
    }

    // Calculate period statistics
    const periodStats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalMinutes: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      completedMinutes: sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration || 0), 0),
      averageSessionLength: 0,
      completionRate: 0,
      sessionsByDay: {},
      tagStats: {},
      locationStats: {}
    };

    // Calculate completion rate
    if (periodStats.totalSessions > 0) {
      periodStats.completionRate = Math.round(
        (periodStats.completedSessions / periodStats.totalSessions) * 100
      );
    }

    // Calculate average session length
    if (periodStats.completedSessions > 0) {
      periodStats.averageSessionLength = Math.round(
        periodStats.completedMinutes / periodStats.completedSessions
      );
    }

    // Group sessions by day
    sessions.forEach(session => {
      const day = session.start_time.split('T')[0];
      if (!periodStats.sessionsByDay[day]) {
        periodStats.sessionsByDay[day] = {
          total: 0,
          completed: 0,
          minutes: 0
        };
      }
      
      periodStats.sessionsByDay[day].total++;
      periodStats.sessionsByDay[day].minutes += session.duration || 0;
      
      if (session.status === 'completed') {
        periodStats.sessionsByDay[day].completed++;
      }
    });

    // Analyze tags
    sessions.forEach(session => {
      if (session.tags) {
        const tags = session.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        tags.forEach(tag => {
          if (!periodStats.tagStats[tag]) {
            periodStats.tagStats[tag] = { count: 0, minutes: 0 };
          }
          periodStats.tagStats[tag].count++;
          if (session.status === 'completed') {
            periodStats.tagStats[tag].minutes += session.duration || 0;
          }
        });
      }
    });

    // Analyze locations
    sessions.forEach(session => {
      if (session.location) {
        if (!periodStats.locationStats[session.location]) {
          periodStats.locationStats[session.location] = { count: 0, minutes: 0 };
        }
        periodStats.locationStats[session.location].count++;
        if (session.status === 'completed') {
          periodStats.locationStats[session.location].minutes += session.duration || 0;
        }
      }
    });

    const response = {
      overall: userStats,
      period: {
        ...periodStats,
        dateRange: dateFilter,
        period,
      },
      goals: {
        weeklyGoal: userStats.weekly_goal || 140,
        weeklyProgress: period === 'week' ? periodStats.completedMinutes : 0,
        weeklyProgressPercentage: period === 'week' && userStats.weekly_goal 
          ? Math.round((periodStats.completedMinutes / userStats.weekly_goal) * 100)
          : 0
      }
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Get stats error:', error);
    return sendError(res, 'Failed to retrieve statistics', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getStatsHandler);