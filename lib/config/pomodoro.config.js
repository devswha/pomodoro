/**
 * Pomodoro Timer Configuration
 * Timer durations, notifications, and session settings
 */

// Timer Duration Settings
export const POMODORO_CONFIG = {
  // Default session duration (minutes)
  defaultDuration: 25,

  // Available duration options (minutes)
  durations: [25, 50],

  // Full duration options for custom timer (minutes)
  durationOptions: [15, 25, 30, 45, 60],

  // Default session title
  defaultSessionTitle: 'STEP 세션',

  // Timer update interval (milliseconds)
  updateInterval: 1000,
};

// Notification Settings
export const NOTIFICATION_CONFIG = {
  // Low time warning threshold (seconds)
  lowTimeThreshold: 300, // 5 minutes

  // Warning notification cooldown (milliseconds)
  warningCooldown: 60000, // 1 minute

  // Critical time threshold (seconds)
  criticalTimeThreshold: 60, // 1 minute
};

// Session Goals
export const GOALS_CONFIG = {
  // Weekly goal in minutes
  weeklyMinutes: 140,

  // Daily goal in sessions
  dailySessions: 4,
};

// User Statistics Initial Values
export const USER_STATS_CONFIG = {
  initial: {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyGoal: 140,
    lastSessionDate: null,
  },
};

export default {
  POMODORO_CONFIG,
  NOTIFICATION_CONFIG,
  GOALS_CONFIG,
  USER_STATS_CONFIG,
};
