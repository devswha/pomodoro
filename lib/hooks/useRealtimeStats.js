'use client';

/**
 * useRealtimeStats - Real-time statistics and leaderboard management hook
 * Handles live stats updates, competitive features, and achievements
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext';
import { useUser } from '../contexts/UserContext';
import { supabase, TABLES } from '../supabase/client';

export const useRealtimeStats = () => {
  const { currentUser } = useUser();
  const {
    realtimeStats,
    leaderboard,
    isConnected,
    optimisticUpdate,
    broadcastMessage,
  } = useRealtime();

  const [userStats, setUserStats] = useState(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [personalBests, setPersonalBests] = useState({});
  const [streakData, setStreakData] = useState({
    current: 0,
    longest: 0,
    today: false,
  });

  const [competitiveFeatures, setCompetitiveFeatures] = useState({
    dailyChallenges: [],
    weeklyChallenge: null,
    monthlyChallenge: null,
    groupChallenges: [],
  });

  const lastStatsUpdateRef = useRef(0);
  const achievementCheckRef = useRef();

  // Real-time stats processing
  const processStatsUpdate = useCallback((newStats) => {
    if (!newStats || !currentUser) return;

    const timestamp = Date.now();
    
    // Prevent duplicate processing
    if (timestamp - lastStatsUpdateRef.current < 1000) return;
    lastStatsUpdateRef.current = timestamp;

    // Calculate deltas for animations
    const previousStats = userStats || {};
    const deltas = {
      completedSessions: (newStats.completed_sessions || 0) - (previousStats.completed_sessions || 0),
      completedMinutes: (newStats.completed_minutes || 0) - (previousStats.completed_minutes || 0),
      streakDays: (newStats.streak_days || 0) - (previousStats.streak_days || 0),
    };

    setUserStats(newStats);

    // Update streak data
    setStreakData({
      current: newStats.streak_days || 0,
      longest: newStats.longest_streak || 0,
      today: checkIfSessionToday(newStats.last_session_date),
    });

    // Check for achievements
    checkAchievements(newStats, previousStats);

    // Update personal bests
    updatePersonalBests(newStats);

    // Broadcast significant achievements
    if (deltas.completedSessions > 0) {
      broadcastAchievement('session_completed', {
        userId: currentUser.id,
        username: currentUser.displayName || currentUser.id,
        totalSessions: newStats.completed_sessions,
        delta: deltas.completedSessions,
      });
    }

    if (deltas.streakDays > 0) {
      broadcastAchievement('streak_increased', {
        userId: currentUser.id,
        username: currentUser.displayName || currentUser.id,
        currentStreak: newStats.streak_days,
        delta: deltas.streakDays,
      });
    }

  }, [userStats, currentUser, broadcastMessage]);

  // Achievement system
  const checkAchievements = useCallback((newStats, previousStats) => {
    const achievementsToCheck = [
      // Session milestones
      {
        id: 'first_session',
        condition: newStats.completed_sessions >= 1 && previousStats.completed_sessions === 0,
        title: 'First Session Complete!',
        description: 'Completed your first Pomodoro session',
        icon: '🍅',
        points: 50,
      },
      {
        id: 'sessions_10',
        condition: newStats.completed_sessions >= 10 && previousStats.completed_sessions < 10,
        title: 'Getting Started',
        description: 'Completed 10 Pomodoro sessions',
        icon: '⭐',
        points: 100,
      },
      {
        id: 'sessions_50',
        condition: newStats.completed_sessions >= 50 && previousStats.completed_sessions < 50,
        title: 'Dedicated Learner',
        description: 'Completed 50 Pomodoro sessions',
        icon: '🎯',
        points: 250,
      },
      {
        id: 'sessions_100',
        condition: newStats.completed_sessions >= 100 && previousStats.completed_sessions < 100,
        title: 'Pomodoro Master',
        description: 'Completed 100 Pomodoro sessions',
        icon: '🏆',
        points: 500,
      },

      // Time milestones
      {
        id: 'hours_10',
        condition: newStats.completed_minutes >= 600 && previousStats.completed_minutes < 600,
        title: '10 Hours Focus',
        description: 'Focused for 10 hours total',
        icon: '⏰',
        points: 200,
      },
      {
        id: 'hours_50',
        condition: newStats.completed_minutes >= 3000 && previousStats.completed_minutes < 3000,
        title: 'Focus Champion',
        description: 'Focused for 50 hours total',
        icon: '💪',
        points: 500,
      },

      // Streak achievements
      {
        id: 'streak_3',
        condition: newStats.streak_days >= 3 && previousStats.streak_days < 3,
        title: '3-Day Streak',
        description: 'Maintained focus for 3 consecutive days',
        icon: '🔥',
        points: 150,
      },
      {
        id: 'streak_7',
        condition: newStats.streak_days >= 7 && previousStats.streak_days < 7,
        title: 'Week Warrior',
        description: 'Maintained focus for 7 consecutive days',
        icon: '⚡',
        points: 300,
      },
      {
        id: 'streak_30',
        condition: newStats.streak_days >= 30 && previousStats.streak_days < 30,
        title: 'Monthly Master',
        description: 'Maintained focus for 30 consecutive days',
        icon: '👑',
        points: 1000,
      },

      // Efficiency achievements
      {
        id: 'completion_rate_80',
        condition: newStats.completion_rate >= 80 && previousStats.completion_rate < 80,
        title: 'Efficient Focuser',
        description: '80% session completion rate',
        icon: '🎯',
        points: 200,
      },
      {
        id: 'completion_rate_95',
        condition: newStats.completion_rate >= 95 && previousStats.completion_rate < 95,
        title: 'Focus Perfectionist',
        description: '95% session completion rate',
        icon: '💎',
        points: 500,
      },

      // Special achievements
      {
        id: 'early_bird',
        condition: checkEarlyBirdSessions(newStats),
        title: 'Early Bird',
        description: 'Complete 10 sessions before 8 AM',
        icon: '🌅',
        points: 300,
      },
      {
        id: 'night_owl',
        condition: checkNightOwlSessions(newStats),
        title: 'Night Owl',
        description: 'Complete 10 sessions after 10 PM',
        icon: '🦉',
        points: 300,
      },
    ];

    const newAchievements = achievementsToCheck
      .filter(achievement => achievement.condition)
      .map(achievement => ({
        ...achievement,
        unlockedAt: new Date().toISOString(),
        userId: currentUser.id,
      }));

    if (newAchievements.length > 0) {
      setAchievements(prev => [...newAchievements, ...prev]);
      
      // Broadcast achievements
      newAchievements.forEach(achievement => {
        broadcastAchievement('achievement_unlocked', {
          userId: currentUser.id,
          username: currentUser.displayName || currentUser.id,
          achievement: achievement,
        });
      });
    }

  }, [currentUser, broadcastMessage]);

  const checkEarlyBirdSessions = useCallback((stats) => {
    // This would need to check session start times from the database
    // For now, return false as placeholder
    return false;
  }, []);

  const checkNightOwlSessions = useCallback((stats) => {
    // This would need to check session start times from the database
    // For now, return false as placeholder
    return false;
  }, []);

  const updatePersonalBests = useCallback((newStats) => {
    setPersonalBests(prev => {
      const updated = { ...prev };
      
      // Update bests
      if (!prev.longestStreak || newStats.longest_streak > prev.longestStreak) {
        updated.longestStreak = newStats.longest_streak;
        updated.longestStreakDate = new Date().toISOString();
      }
      
      if (!prev.bestCompletionRate || newStats.completion_rate > prev.bestCompletionRate) {
        updated.bestCompletionRate = newStats.completion_rate;
        updated.bestCompletionRateDate = new Date().toISOString();
      }
      
      return updated;
    });
  }, []);

  // Leaderboard management
  const updateLeaderboardPosition = useCallback((stats) => {
    setGlobalLeaderboard(prev => {
      const updated = prev.filter(entry => entry.user_id !== currentUser?.id);
      
      const userEntry = {
        user_id: currentUser.id,
        username: currentUser.displayName || currentUser.id,
        completed_sessions: stats.completed_sessions,
        completed_minutes: stats.completed_minutes,
        streak_days: stats.streak_days,
        completion_rate: stats.completion_rate,
        total_points: calculateTotalPoints(stats),
        last_active: new Date().toISOString(),
      };
      
      updated.push(userEntry);
      
      // Sort by total points, then by completed minutes
      return updated.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return b.completed_minutes - a.completed_minutes;
      });
    });
  }, [currentUser]);

  const calculateTotalPoints = useCallback((stats) => {
    let points = 0;
    
    // Base points from sessions
    points += stats.completed_sessions * 10;
    
    // Bonus points from streaks
    points += Math.min(stats.streak_days * 20, 1000); // Max 1000 from streaks
    
    // Efficiency bonus
    if (stats.completion_rate >= 90) points += 500;
    else if (stats.completion_rate >= 80) points += 250;
    else if (stats.completion_rate >= 70) points += 100;
    
    // Achievement points
    points += achievements.reduce((sum, achievement) => sum + (achievement.points || 0), 0);
    
    return points;
  }, [achievements]);

  // Challenge system
  const createChallenge = useCallback(async (challengeData) => {
    const challenge = {
      id: `challenge_${Date.now()}`,
      ...challengeData,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      status: 'active',
      participants: [currentUser.id],
    };

    setChallenges(prev => [...prev, challenge]);

    // Broadcast challenge creation
    if (challengeData.isPublic) {
      await broadcastMessage('global-challenges', 'challenge_created', challenge);
    }

    return challenge;
  }, [currentUser, broadcastMessage]);

  const joinChallenge = useCallback(async (challengeId) => {
    setChallenges(prev =>
      prev.map(challenge =>
        challenge.id === challengeId
          ? {
              ...challenge,
              participants: [...challenge.participants, currentUser.id],
            }
          : challenge
      )
    );

    await broadcastMessage('global-challenges', 'challenge_joined', {
      challengeId,
      userId: currentUser.id,
      username: currentUser.displayName || currentUser.id,
    });
  }, [currentUser, broadcastMessage]);

  // Real-time competitive features
  const initializeDailyChallenges = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const dailyChallenges = [
      {
        id: `daily_sessions_${today}`,
        title: 'Daily Focus',
        description: 'Complete 5 Pomodoro sessions today',
        target: 5,
        type: 'sessions',
        period: 'daily',
        reward: 100,
        deadline: new Date().setHours(23, 59, 59, 999),
      },
      {
        id: `daily_minutes_${today}`,
        title: 'Time Master',
        description: 'Focus for 2 hours today',
        target: 120,
        type: 'minutes',
        period: 'daily',
        reward: 150,
        deadline: new Date().setHours(23, 59, 59, 999),
      },
    ];

    setCompetitiveFeatures(prev => ({
      ...prev,
      dailyChallenges,
    }));
  }, []);

  // Broadcasting system
  const broadcastAchievement = useCallback(async (eventType, data) => {
    if (!isConnected) return;

    try {
      await broadcastMessage('global-activity', eventType, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to broadcast achievement:', error);
    }
  }, [isConnected, broadcastMessage]);

  // Utility functions
  const checkIfSessionToday = useCallback((lastSessionDate) => {
    if (!lastSessionDate) return false;
    
    const today = new Date().toISOString().split('T')[0];
    return lastSessionDate.split('T')[0] === today;
  }, []);

  const getUserRank = useCallback((leaderboard = globalLeaderboard) => {
    const userIndex = leaderboard.findIndex(entry => entry.user_id === currentUser?.id);
    return userIndex >= 0 ? userIndex + 1 : null;
  }, [globalLeaderboard, currentUser]);

  const getLeaderboardSlice = useCallback((start = 0, limit = 10) => {
    return globalLeaderboard.slice(start, start + limit);
  }, [globalLeaderboard]);

  const getUsersNearby = useCallback((range = 5) => {
    const userRank = getUserRank();
    if (!userRank) return [];

    const start = Math.max(0, userRank - range - 1);
    const end = Math.min(globalLeaderboard.length, userRank + range);
    
    return globalLeaderboard.slice(start, end);
  }, [getUserRank, globalLeaderboard]);

  // React to real-time stats updates
  useEffect(() => {
    if (realtimeStats) {
      processStatsUpdate(realtimeStats);
      updateLeaderboardPosition(realtimeStats);
    }
  }, [realtimeStats, processStatsUpdate, updateLeaderboardPosition]);

  // Process leaderboard updates from realtime context
  useEffect(() => {
    if (leaderboard && leaderboard.length > 0) {
      setGlobalLeaderboard(leaderboard);
    }
  }, [leaderboard]);

  // Initialize competitive features
  useEffect(() => {
    if (currentUser) {
      initializeDailyChallenges();
    }
  }, [currentUser, initializeDailyChallenges]);

  // Cleanup achievement checker
  useEffect(() => {
    return () => {
      if (achievementCheckRef.current) {
        clearTimeout(achievementCheckRef.current);
      }
    };
  }, []);

  return {
    // User stats
    userStats,
    streakData,
    personalBests,
    
    // Leaderboards
    globalLeaderboard,
    friendsLeaderboard,
    getUserRank,
    getLeaderboardSlice,
    getUsersNearby,
    
    // Achievements
    achievements,
    
    // Challenges
    challenges,
    competitiveFeatures,
    createChallenge,
    joinChallenge,
    
    // Utilities
    isConnected,
    calculateTotalPoints,
  };
};

export default useRealtimeStats;