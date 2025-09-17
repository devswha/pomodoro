/**
 * Leaderboard API Endpoint
 * GET /api/dashboard/leaderboard - Get leaderboard data
 * 
 * Returns leaderboard rankings based on completed sessions and minutes.
 */

import { supabaseAdmin, TABLES } from '../../../../lib/supabase/client.js';
import { leaderboardQuerySchema, validateSchema } from '../../../../lib/validators/schemas.js';
import { 
  sendSuccess, 
  sendError,
  sendValidationError,
  validateMethod,
  withErrorHandling
} from '../../../../lib/utils/api-response.js';
import { optionalAuth } from '../../../../lib/middleware/auth.js';

async function getLeaderboardHandler(req, res) {
  // Validate HTTP method
  if (!validateMethod(req, res, ['GET'])) return;

  // Apply optional authentication - leaderboard can be viewed without auth but shows different data
  await new Promise((resolve, reject) => {
    optionalAuth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!supabaseAdmin) {
    return sendError(res, 'Database access not available', 503);
  }

  // Validate query parameters
  const validation = validateSchema(leaderboardQuerySchema, req.query || {});
  if (!validation.success) {
    return sendValidationError(res, validation.errors);
  }

  try {
    const { period, limit } = validation.data;
    const userId = req.userId; // May be null if not authenticated

    // Calculate date range for the period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    // Get sessions data for the period
    const { data: sessions, error } = await supabaseAdmin
      .from(TABLES.POMODORO_SESSIONS)
      .select(`
        user_id,
        duration,
        status,
        start_time
      `)
      .eq('status', 'completed')
      .gte('start_time', `${startDateStr}T00:00:00`)
      .lte('start_time', `${endDateStr}T23:59:59`);

    if (error) {
      console.error('Failed to get leaderboard sessions:', error);
      return sendError(res, 'Failed to retrieve leaderboard data', 500);
    }

    // Group by user and calculate stats
    const userStats = {};
    (sessions || []).forEach(session => {
      const { user_id, duration } = session;
      
      if (!userStats[user_id]) {
        userStats[user_id] = {
          userId: user_id,
          completedSessions: 0,
          completedMinutes: 0,
          averageSessionLength: 0
        };
      }
      
      userStats[user_id].completedSessions++;
      userStats[user_id].completedMinutes += duration || 0;
    });

    // Calculate averages and convert to array
    const leaderboardEntries = Object.values(userStats).map(stats => ({
      ...stats,
      averageSessionLength: stats.completedSessions > 0 
        ? Math.round(stats.completedMinutes / stats.completedSessions)
        : 0
    }));

    // Sort by completed minutes (primary) and sessions (secondary)
    leaderboardEntries.sort((a, b) => {
      if (b.completedMinutes !== a.completedMinutes) {
        return b.completedMinutes - a.completedMinutes;
      }
      return b.completedSessions - a.completedSessions;
    });

    // Get user profiles for the top users
    const topUserIds = leaderboardEntries.slice(0, limit).map(entry => entry.userId);
    
    const { data: userProfiles } = topUserIds.length > 0 ? await supabaseAdmin
      .from(TABLES.USERS)
      .select(`
        id,
        username,
        display_name,
        avatar_url
      `)
      .in('id', topUserIds) : { data: [] };

    // Create user profile lookup
    const profileLookup = {};
    (userProfiles || []).forEach(profile => {
      profileLookup[profile.id] = profile;
    });

    // Build final leaderboard with rankings and user info
    const leaderboard = leaderboardEntries.slice(0, limit).map((entry, index) => {
      const profile = profileLookup[entry.userId];
      
      return {
        rank: index + 1,
        userId: entry.userId,
        username: profile ? profile.username : 'Anonymous',
        displayName: profile ? profile.display_name : 'Anonymous User',
        avatarUrl: profile ? profile.avatar_url : null,
        completedSessions: entry.completedSessions,
        completedMinutes: entry.completedMinutes,
        averageSessionLength: entry.averageSessionLength,
        isCurrentUser: userId && entry.userId === userId
      };
    });

    // Find current user's position if authenticated
    let currentUserRank = null;
    if (userId) {
      const currentUserIndex = leaderboardEntries.findIndex(entry => entry.userId === userId);
      if (currentUserIndex !== -1) {
        currentUserRank = {
          rank: currentUserIndex + 1,
          completedSessions: leaderboardEntries[currentUserIndex].completedSessions,
          completedMinutes: leaderboardEntries[currentUserIndex].completedMinutes,
          averageSessionLength: leaderboardEntries[currentUserIndex].averageSessionLength
        };
      }
    }

    const response = {
      leaderboard,
      period,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      },
      totalParticipants: leaderboardEntries.length,
      currentUserRank: currentUserRank,
      periodStats: {
        totalSessions: sessions ? sessions.length : 0,
        totalMinutes: sessions ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) : 0,
        averageSessionLength: sessions && sessions.length > 0 
          ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
          : 0
      }
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Leaderboard error:', error);
    return sendError(res, 'Failed to load leaderboard', 500);
  }
}

// Named exports for App Router
export const GET = withErrorHandling(getLeaderboardHandler);