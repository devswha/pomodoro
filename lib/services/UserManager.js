/**
 * React용 사용자 관리 시스템
 * localStorage 기반 회원별 데이터 관리
 */

export class UserManager {
  constructor() {
    this.usersKey = 'registeredUsers';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.usersKey)) {
      localStorage.setItem(this.usersKey, JSON.stringify({}));
    }
  }

  registerUser(userId, userData = {}) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('유효한 사용자 ID가 필요합니다.');
    }

    const users = this.getAllUsers();
    
    if (users[userId]) {
      return this.getUser(userId);
    }

    const newUser = {
      id: userId,
      displayName: userData.displayName || userId,
      email: userData.email || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      preferences: {
        defaultPomodoroLength: 25,
        breakLength: 5,
        longBreakLength: 15,
        weeklyGoal: 140,
        theme: 'default'
      }
    };

    users[userId] = newUser;
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    this.initializeUserStats(userId);

    return newUser;
  }

  initializeUserStats(userId) {
    const userStatsKey = `userStats_${userId}`;
    
    const initialStats = {
      userId: userId,
      totalSessions: 0,
      completedSessions: 0,
      totalMinutes: 0,
      completedMinutes: 0,
      streakDays: 0,
      longestStreak: 0,
      lastSessionDate: null,
      weeklyGoal: 140,
      monthlyStats: {},
      dailyStats: {},
      tags: {},
      locations: {},
      completionRate: 0,
      averageSessionLength: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(userStatsKey, JSON.stringify(initialStats));
    
    const userSessionsKey = `pomodoroSessions_${userId}`;
    localStorage.setItem(userSessionsKey, JSON.stringify([]));
  }

  loginUser(userId, userData = {}) {
    const users = this.getAllUsers();
    
    if (!users[userId]) {
      return this.registerUser(userId, userData);
    }

    users[userId].lastLogin = new Date().toISOString();
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    
    return users[userId];
  }

  getUser(userId) {
    const users = this.getAllUsers();
    return users[userId] || null;
  }

  getAllUsers() {
    return JSON.parse(localStorage.getItem(this.usersKey) || '{}');
  }

  getUserStats(userId) {
    const userStatsKey = `userStats_${userId}`;
    const stats = JSON.parse(localStorage.getItem(userStatsKey) || 'null');
    
    if (!stats) {
      this.initializeUserStats(userId);
      return JSON.parse(localStorage.getItem(userStatsKey));
    }
    
    return stats;
  }

  getUserSessions(userId) {
    const userSessionsKey = `pomodoroSessions_${userId}`;
    return JSON.parse(localStorage.getItem(userSessionsKey) || '[]');
  }

  getActiveSession(userId) {
    const activeSessionKey = `activePomodoroSession_${userId}`;
    const sessionData = localStorage.getItem(activeSessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  createPomodoroSession(userId, sessionData) {
    const now = new Date();
    let startTime;
    
    // Calculate start time
    if (sessionData.scheduledTime) {
      const scheduled = new Date(sessionData.scheduledTime);
      startTime = scheduled > now ? scheduled : now;
    } else {
      startTime = now;
    }
    
    const sessionId = `session_${Date.now()}`;
    const duration = (sessionData.duration || 25) * 60 * 1000; // in milliseconds
    
    const activeSession = {
      id: sessionId,
      title: sessionData.title || '뽀모도로 세션',
      goal: sessionData.goal || '',
      tags: sessionData.tags || '',
      location: sessionData.location || '',
      duration: sessionData.duration || 25, // in minutes
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + duration).toISOString(),
      user: userId,
      status: 'active',
      createdAt: now.toISOString()
    };
    
    // Store active session
    const activeSessionKey = `activePomodoroSession_${userId}`;
    localStorage.setItem(activeSessionKey, JSON.stringify(activeSession));
    
    // Store in sessions history
    const userSessionsKey = `pomodoroSessions_${userId}`;
    const sessions = JSON.parse(localStorage.getItem(userSessionsKey) || '[]');
    sessions.push({
      ...activeSession,
      status: 'scheduled'
    });
    localStorage.setItem(userSessionsKey, JSON.stringify(sessions));
    
    // Update user statistics
    this.updateUserStatsForNewSession(userId, activeSession);
    
    return activeSession;
  }

  updateUserStatsForNewSession(userId, sessionData) {
    const currentStats = this.getUserStats(userId);
    
    const updates = {
      totalSessions: currentStats.totalSessions + 1,
      totalMinutes: currentStats.totalMinutes + sessionData.duration
    };
    
    // Track daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!currentStats.dailyStats[today]) {
      currentStats.dailyStats[today] = { sessions: 0, minutes: 0, completed: 0 };
    }
    currentStats.dailyStats[today].sessions++;
    currentStats.dailyStats[today].minutes += sessionData.duration;
    updates.dailyStats = currentStats.dailyStats;
    
    // Track monthly stats
    const month = today.substring(0, 7);
    if (!currentStats.monthlyStats[month]) {
      currentStats.monthlyStats[month] = { sessions: 0, minutes: 0, completed: 0 };
    }
    currentStats.monthlyStats[month].sessions++;
    currentStats.monthlyStats[month].minutes += sessionData.duration;
    updates.monthlyStats = currentStats.monthlyStats;
    
    // Track tags
    if (sessionData.tags) {
      const tags = sessionData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      tags.forEach(tag => {
        if (!currentStats.tags[tag]) {
          currentStats.tags[tag] = { count: 0, minutes: 0 };
        }
        currentStats.tags[tag].count++;
        currentStats.tags[tag].minutes += sessionData.duration;
      });
      updates.tags = currentStats.tags;
    }
    
    // Track locations
    if (sessionData.location) {
      if (!currentStats.locations[sessionData.location]) {
        currentStats.locations[sessionData.location] = { count: 0, minutes: 0 };
      }
      currentStats.locations[sessionData.location].count++;
      currentStats.locations[sessionData.location].minutes += sessionData.duration;
      updates.locations = currentStats.locations;
    }
    
    // Update streak
    this.updateStreak(currentStats, today);
    updates.streakDays = currentStats.streakDays;
    updates.longestStreak = currentStats.longestStreak;
    updates.lastSessionDate = today;
    
    this.updateUserStats(userId, updates);
  }

  updateStreak(userStats, today) {
    const lastDate = userStats.lastSessionDate;
    
    if (!lastDate) {
      userStats.streakDays = 1;
    } else {
      const lastSessionDate = new Date(lastDate);
      const currentDate = new Date(today);
      const daysDiff = Math.floor((currentDate - lastSessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, streak continues
      } else if (daysDiff === 1) {
        // Next day, increase streak
        userStats.streakDays++;
      } else {
        // Streak broken, reset
        userStats.streakDays = 1;
      }
    }
    
    if (userStats.streakDays > userStats.longestStreak) {
      userStats.longestStreak = userStats.streakDays;
    }
  }

  completePomodoroSession(userId, sessionId) {
    const activeSessionKey = `activePomodoroSession_${userId}`;
    const activeSession = JSON.parse(localStorage.getItem(activeSessionKey) || 'null');
    
    if (!activeSession || activeSession.id !== sessionId) return;
    
    // Remove active session
    localStorage.removeItem(activeSessionKey);
    
    // Update session in history
    const userSessionsKey = `pomodoroSessions_${userId}`;
    const sessions = JSON.parse(localStorage.getItem(userSessionsKey) || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].status = 'completed';
      sessions[sessionIndex].completedAt = new Date().toISOString();
      localStorage.setItem(userSessionsKey, JSON.stringify(sessions));
    }
    
    // Update completion stats
    this.updateUserStatsForCompletion(userId, activeSession);
  }

  updateUserStatsForCompletion(userId, session) {
    const currentStats = this.getUserStats(userId);
    
    const updates = {
      completedSessions: currentStats.completedSessions + 1,
      completedMinutes: currentStats.completedMinutes + session.duration
    };
    
    // Update daily completion stats
    const today = new Date().toISOString().split('T')[0];
    if (currentStats.dailyStats[today]) {
      currentStats.dailyStats[today].completed++;
      updates.dailyStats = currentStats.dailyStats;
    }
    
    // Update monthly completion stats
    const month = today.substring(0, 7);
    if (currentStats.monthlyStats[month]) {
      currentStats.monthlyStats[month].completed++;
      updates.monthlyStats = currentStats.monthlyStats;
    }
    
    this.updateUserStats(userId, updates);
  }

  stopPomodoroSession(userId, sessionId) {
    const activeSessionKey = `activePomodoroSession_${userId}`;
    localStorage.removeItem(activeSessionKey);
    
    // Update session in history
    const userSessionsKey = `pomodoroSessions_${userId}`;
    const sessions = JSON.parse(localStorage.getItem(userSessionsKey) || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].status = 'stopped';
      sessions[sessionIndex].stoppedAt = new Date().toISOString();
      localStorage.setItem(userSessionsKey, JSON.stringify(sessions));
    }
  }

  clearActiveSession(userId) {
    const activeSessionKey = `activePomodoroSession_${userId}`;
    localStorage.removeItem(activeSessionKey);
  }

  updateUserStats(userId, updates) {
    const userStatsKey = `userStats_${userId}`;
    const currentStats = this.getUserStats(userId);
    
    const updatedStats = {
      ...currentStats,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Calculate completion rate
    if (updatedStats.totalSessions > 0) {
      updatedStats.completionRate = Math.round(
        (updatedStats.completedSessions / updatedStats.totalSessions) * 100
      );
    }

    // Calculate average session length
    if (updatedStats.completedSessions > 0) {
      updatedStats.averageSessionLength = Math.round(
        updatedStats.completedMinutes / updatedStats.completedSessions
      );
    }

    localStorage.setItem(userStatsKey, JSON.stringify(updatedStats));
    return updatedStats;
  }

  deleteUser(userId) {
    if (!userId) return false;

    const users = this.getAllUsers();
    delete users[userId];
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    const keysToDelete = [
      `userStats_${userId}`,
      `pomodoroSessions_${userId}`,
      `activePomodoroSession_${userId}`
    ];

    keysToDelete.forEach(key => {
      localStorage.removeItem(key);
    });

    return true;
  }

  // Meeting Management Methods
  getMeetings(userId) {
    const meetingsKey = `meetings_${userId}`;
    const meetings = localStorage.getItem(meetingsKey);
    return meetings ? JSON.parse(meetings) : [];
  }

  saveMeeting(userId, meeting) {
    const meetings = this.getMeetings(userId);
    const newMeeting = {
      id: Date.now().toString(),
      ...meeting,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    meetings.push(newMeeting);
    const meetingsKey = `meetings_${userId}`;
    localStorage.setItem(meetingsKey, JSON.stringify(meetings));
    
    return newMeeting;
  }

  updateMeeting(userId, meetingId, updates) {
    const meetings = this.getMeetings(userId);
    const meetingIndex = meetings.findIndex(meeting => meeting.id === meetingId);
    
    if (meetingIndex === -1) return null;
    
    meetings[meetingIndex] = {
      ...meetings[meetingIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const meetingsKey = `meetings_${userId}`;
    localStorage.setItem(meetingsKey, JSON.stringify(meetings));
    
    return meetings[meetingIndex];
  }

  deleteMeeting(userId, meetingId) {
    const meetings = this.getMeetings(userId);
    const filteredMeetings = meetings.filter(meeting => meeting.id !== meetingId);
    
    const meetingsKey = `meetings_${userId}`;
    localStorage.setItem(meetingsKey, JSON.stringify(filteredMeetings));
    
    return true;
  }

  getUpcomingMeetings(userId, limit = 5) {
    const meetings = this.getMeetings(userId);
    const now = new Date();
    
    return meetings
      .filter(meeting => {
        const meetingDateTime = new Date(meeting.date + 'T' + meeting.time);
        return meetingDateTime >= now;
      })
      .sort((a, b) => {
        const dateTimeA = new Date(a.date + 'T' + a.time);
        const dateTimeB = new Date(b.date + 'T' + b.time);
        return dateTimeA - dateTimeB;
      })
      .slice(0, limit);
  }

  getMeetingsForDate(userId, date) {
    const meetings = this.getMeetings(userId);
    const targetDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    
    return meetings
      .filter(meeting => meeting.date === targetDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  getMeetingsForWeek(userId, startDate) {
    const meetings = this.getMeetings(userId);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    return meetings
      .filter(meeting => meeting.date >= startDateStr && meeting.date <= endDateStr)
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison === 0) {
          return a.time.localeCompare(b.time);
        }
        return dateComparison;
      });
  }

  getMeetingsForMonth(userId, year, month) {
    const meetings = this.getMeetings(userId);
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    return meetings
      .filter(meeting => meeting.date.startsWith(monthStr))
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison === 0) {
          return a.time.localeCompare(b.time);
        }
        return dateComparison;
      });
  }
}