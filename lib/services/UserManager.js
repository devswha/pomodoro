/**
 * Enhanced User Management System for Pomodoro Timer
 * safeLocalStorage 기반 회원별 데이터 관리 with secure authentication
 */

// Enhanced password hashing using PBKDF2 with multiple iterations
const hashPassword = async (password, salt = null, iterations = 100000) => {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Enhanced fallback for environments without crypto API
    const fallbackSalt = salt || 'enhanced_fallback_salt_2024';
    let hash = password + fallbackSalt;
    // Simple iterations for fallback
    for (let i = 0; i < 1000; i++) {
      hash = btoa(hash).substring(0, 32) + hash;
    }
    return {
      hash: btoa(hash).substring(0, 64),
      salt: Array.from(new TextEncoder().encode(fallbackSalt)),
      iterations: 1000,
      algorithm: 'fallback'
    };
  }
  
  try {
    const encoder = new TextEncoder();
    const saltToUse = salt || crypto.getRandomValues(new Uint8Array(32)); // Larger salt
    const passwordData = encoder.encode(password);
    
    // Import password as cryptographic key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive key using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltToUse,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 32 bytes
    );
    
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return {
      hash: hashHex,
      salt: Array.from(saltToUse),
      iterations: iterations,
      algorithm: 'PBKDF2-SHA256'
    };
  } catch (error) {
    console.warn('PBKDF2 hashing failed, using enhanced fallback:', error);
    const fallbackSalt = salt || crypto.getRandomValues(new Uint8Array(32));
    const saltedPassword = password + Array.from(fallbackSalt).join('');
    
    let hash = saltedPassword;
    for (let i = 0; i < 10000; i++) {
      hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hash));
      hash = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    return {
      hash: hash,
      salt: Array.from(fallbackSalt),
      iterations: 10000,
      algorithm: 'SHA256-iterative'
    };
  }
};

// Verify password against stored hash with algorithm detection
const verifyPassword = async (password, storedHashData, storedSalt = null, iterations = null) => {
  // Handle legacy string hash format
  if (typeof storedHashData === 'string') {
    // Multiple legacy formats support
    const legacyFormats = [
      () => btoa(password + 'fallback_salt'),
      () => btoa(password + 'enhanced_fallback_salt_2024'),
      () => btoa(password + (storedSalt || 'fallback_salt'))
    ];
    
    for (const format of legacyFormats) {
      try {
        if (format() === storedHashData) return true;
      } catch (e) {
        continue;
      }
    }
    return false;
  }
  
  // Handle object hash format with algorithm detection
  if (typeof storedHashData === 'object' && storedHashData.hash) {
    try {
      const saltArray = new Uint8Array(storedHashData.salt || storedSalt || []);
      const iterationsToUse = storedHashData.iterations || iterations || 100000;
      
      const hashedInput = await hashPassword(password, saltArray, iterationsToUse);
      
      // Compare hashes using constant-time comparison to prevent timing attacks
      return constantTimeEquals(hashedInput.hash, storedHashData.hash);
    } catch (error) {
      console.warn('Enhanced password verification failed:', error);
      return false;
    }
  }
  
  // Fallback for any other format
  try {
    const saltArray = storedSalt ? new Uint8Array(storedSalt) : null;
    const hashedInput = await hashPassword(password, saltArray);
    return hashedInput.hash === storedHashData;
  } catch (error) {
    console.warn('Password verification failed:', error);
    return false;
  }
};

// Constant-time string comparison to prevent timing attacks
const constantTimeEquals = (a, b) => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

// Very simple password validation - accept any password with minimum length
const validatePasswordStrength = (password) => {
  const errors = [];
  const warnings = [];
  
  // Only basic length requirement - 4 characters minimum
  if (password.length < 4) {
    errors.push('비밀번호는 4자 이상이어야 합니다');
  }
  
  // No character type requirements - accept any characters
  
  // Simple strength calculation
  let score = Math.min(password.length * 10, 100); // Simple length-based score
  
  const strength = {
    weak: score < 50,
    medium: score >= 50 && score < 80,
    strong: score >= 80
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    strength: strength.strong ? 'strong' : (strength.medium ? 'medium' : 'weak')
  };
};

// Simplified email validation
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: '이메일을 입력해주세요.'
    };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Very simple email validation - just check for @ symbol
  if (!trimmedEmail.includes('@')) {
    return {
      isValid: false,
      error: '이메일에 @가 포함되어야 합니다.'
    };
  }
  
  return {
    isValid: true,
    normalizedEmail: trimmedEmail
  };
};

// Enhanced username validation
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      error: '사용자명을 입력해주세요.'
    };
  }
  
  const trimmedUsername = username.trim();
  
  // Very simple length validation
  if (trimmedUsername.length < 1) {
    return {
      isValid: false,
      error: '사용자명을 입력해주세요.'
    };
  }
  
  if (trimmedUsername.length > 50) {
    return {
      isValid: false,
      error: '사용자명은 50자 이하여야 합니다.'
    };
  }
  
  // No reserved words check - accept any username including "test"
  
  return {
    isValid: true,
    normalizedUsername: trimmedUsername
  };
};

// Generate session token
const generateSessionToken = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto API
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// SSR-safe localStorage helpers
const safeLocalStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage getItem error:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage setItem error:', error);
    }
  },
  
  removeItem: (key) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage removeItem error:', error);
    }
  }
};

export class UserManager {
  constructor() {
    this.usersKey = 'registeredUsers';
    this.sessionsKey = 'userSessions';
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.extendedSessionTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days for remember me
    this.maxLoginAttempts = 5;
    this.accountLockTime = 30 * 60 * 1000; // 30 minutes
    this.sessionCleanupInterval = null;
    this.init();
  }

  init() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    if (!safeLocalStorage.getItem(this.usersKey)) {
      safeLocalStorage.setItem(this.usersKey, JSON.stringify({}));
    }
    
    if (!safeLocalStorage.getItem(this.sessionsKey)) {
      safeLocalStorage.setItem(this.sessionsKey, JSON.stringify({}));
    }
    
    // Clean up expired sessions on initialization
    this.cleanupExpiredSessions();
    
    // Set up automatic session cleanup every 5 minutes
    if (!this.sessionCleanupInterval) {
      this.sessionCleanupInterval = setInterval(() => {
        this.cleanupExpiredSessions();
      }, 5 * 60 * 1000);
    }
  }

  // Check if username is unique
  isUsernameUnique(username) {
    const users = this.getAllUsers();
    return !users[username];
  }
  
  // Check if email is unique
  isEmailUnique(email) {
    const users = this.getAllUsers();
    return !Object.values(users).some(user => user.email === email);
  }

  async registerUser(userId, userData = {}) {
    // Enhanced input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('유효한 사용자 ID가 필요합니다.');
    }
    
    // Validate username
    const usernameValidation = validateUsername(userId);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.error);
    }
    
    // Validate input data
    if (!userData.password) {
      throw new Error('비밀번호가 필요합니다.');
    }
    
    if (!userData.email) {
      throw new Error('이메일이 필요합니다.');
    }

    // Use Supabase API for registration
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userId,
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName || userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      return result.data.user;
    } catch (error) {
      console.error('Registration API error:', error);
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }
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

    safeLocalStorage.setItem(userStatsKey, JSON.stringify(initialStats));
    
    const userSessionsKey = `pomodoroSessions_${userId}`;
    safeLocalStorage.setItem(userSessionsKey, JSON.stringify([]));
  }

  async loginUser(userId, password, rememberMe = false) {
    if (!userId || !password) {
      throw new Error('사용자명과 비밀번호가 필요합니다.');
    }

    // Use Supabase API for login
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userId,
          password: password,
          rememberMe: rememberMe,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store session in localStorage for compatibility
      const sessionToken = result.data.session.accessToken;
      const sessionData = {
        userId: result.data.user.id,
        token: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(result.data.session.expiresAt * 1000).toISOString(),
        rememberMe: rememberMe,
        lastActivity: new Date().toISOString(),
        isActive: true
      };

      const sessions = this.getSessions();
      sessions[sessionToken] = sessionData;
      safeLocalStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
      safeLocalStorage.setItem('currentSessionToken', sessionToken);

      return {
        user: result.data.user,
        sessionToken: sessionToken
      };

    } catch (error) {
      console.error('Login API error:', error);
      throw new Error(error.message || '로그인에 실패했습니다.');
    }
  }

  getUser(userId) {
    const users = this.getAllUsers();
    const user = users[userId];
    if (!user) return null;
    
    // Return user without sensitive data
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      preferences: user.preferences,
      avatar: user.avatar,
      bio: user.bio,
      emailVerified: user.emailVerified
    };
  }

  getAllUsers() {
    return JSON.parse(safeLocalStorage.getItem(this.usersKey) || '{}');
  }
  
  getSessions() {
    return JSON.parse(safeLocalStorage.getItem(this.sessionsKey) || '{}');
  }

  getUserStats(userId) {
    const userStatsKey = `userStats_${userId}`;
    const stats = JSON.parse(safeLocalStorage.getItem(userStatsKey) || 'null');
    
    if (!stats) {
      this.initializeUserStats(userId);
      return JSON.parse(safeLocalStorage.getItem(userStatsKey));
    }
    
    return stats;
  }

  getUserSessions(userId) {
    const userSessionsKey = `pomodoroSessions_${userId}`;
    return JSON.parse(safeLocalStorage.getItem(userSessionsKey) || '[]');
  }

  getActiveSession(userId) {
    const activeSessionKey = `activePomodoroSession_${userId}`;
    const sessionData = safeLocalStorage.getItem(activeSessionKey);
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
    safeLocalStorage.setItem(activeSessionKey, JSON.stringify(activeSession));
    
    // Store in sessions history
    const userSessionsKey = `pomodoroSessions_${userId}`;
    const sessions = JSON.parse(safeLocalStorage.getItem(userSessionsKey) || '[]');
    sessions.push({
      ...activeSession,
      status: 'scheduled'
    });
    safeLocalStorage.setItem(userSessionsKey, JSON.stringify(sessions));
    
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
    const activeSession = JSON.parse(safeLocalStorage.getItem(activeSessionKey) || 'null');
    
    if (!activeSession || activeSession.id !== sessionId) return;
    
    // Remove active session
    safeLocalStorage.removeItem(activeSessionKey);
    
    // Update session in history
    const userSessionsKey = `pomodoroSessions_${userId}`;
    const sessions = JSON.parse(safeLocalStorage.getItem(userSessionsKey) || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].status = 'completed';
      sessions[sessionIndex].completedAt = new Date().toISOString();
      safeLocalStorage.setItem(userSessionsKey, JSON.stringify(sessions));
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
    safeLocalStorage.removeItem(activeSessionKey);
    
    // Update session in history
    const userSessionsKey = `pomodoroSessions_${userId}`;
    const sessions = JSON.parse(safeLocalStorage.getItem(userSessionsKey) || '[]');
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex].status = 'stopped';
      sessions[sessionIndex].stoppedAt = new Date().toISOString();
      safeLocalStorage.setItem(userSessionsKey, JSON.stringify(sessions));
    }
  }

  clearActiveSession(userId) {
    const activeSessionKey = `activePomodoroSession_${userId}`;
    safeLocalStorage.removeItem(activeSessionKey);
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

    safeLocalStorage.setItem(userStatsKey, JSON.stringify(updatedStats));
    return updatedStats;
  }
  
  // Session management methods
  validateSession(sessionToken) {
    if (!sessionToken) return null;
    
    const sessions = this.getSessions();
    const session = sessions[sessionToken];
    
    if (!session || !session.isActive) return null;
    
    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (now > expiresAt) {
      // Clean up expired session
      this.invalidateSession(sessionToken);
      return null;
    }
    
    // Check for suspicious activity (optional IP validation)
    const currentIP = this.getClientIP();
    if (session.ipAddress && currentIP && session.ipAddress !== currentIP) {
      console.warn('Session IP mismatch detected:', { original: session.ipAddress, current: currentIP });
      // Optionally invalidate session on IP change
      // this.invalidateSession(sessionToken);
      // return null;
    }
    
    // Update last activity
    session.lastActivity = now.toISOString();
    
    // Extend expiration if remember me is enabled
    const sessionTimeout = session.rememberMe ? this.extendedSessionTimeout : this.sessionTimeout;
    session.expiresAt = new Date(now.getTime() + sessionTimeout).toISOString();
    
    sessions[sessionToken] = session;
    safeLocalStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    
    return session;
  }
  
  getCurrentSession() {
    const sessionToken = safeLocalStorage.getItem('currentSessionToken');
    return this.validateSession(sessionToken);
  }
  
  logoutSession(sessionToken = null) {
    const tokenToRemove = sessionToken || safeLocalStorage.getItem('currentSessionToken');
    
    if (tokenToRemove) {
      this.invalidateSession(tokenToRemove);
    }
    
    safeLocalStorage.removeItem('currentSessionToken');
    safeLocalStorage.removeItem('currentUser');
  }
  
  // Invalidate a specific session
  invalidateSession(sessionToken) {
    const sessions = this.getSessions();
    if (sessions[sessionToken]) {
      sessions[sessionToken].isActive = false;
      sessions[sessionToken].invalidatedAt = new Date().toISOString();
      safeLocalStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    }
  }
  
  // Invalidate all sessions for a user
  invalidateAllUserSessions(userId) {
    const sessions = this.getSessions();
    let changed = false;
    
    Object.keys(sessions).forEach(token => {
      if (sessions[token].userId === userId && sessions[token].isActive) {
        sessions[token].isActive = false;
        sessions[token].invalidatedAt = new Date().toISOString();
        changed = true;
      }
    });
    
    if (changed) {
      safeLocalStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    }
  }
  
  // Get client IP (limited in browser environment)
  getClientIP() {
    // In a browser environment, we can't get the real IP
    // This is a placeholder for server-side implementation
    return 'browser-client';
  }
  
  cleanupExpiredSessions() {
    const sessions = this.getSessions();
    const now = new Date();
    let changed = false;
    
    Object.keys(sessions).forEach(token => {
      const session = sessions[token];
      // Remove sessions that are expired or inactive
      if (new Date(session.expiresAt) <= now || !session.isActive) {
        delete sessions[token];
        changed = true;
      }
    });
    
    if (changed) {
      safeLocalStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    }
    
    return changed;
  }
  
  // Enhanced session monitoring
  getActiveSessions(userId) {
    const sessions = this.getSessions();
    const now = new Date();
    
    return Object.values(sessions).filter(session => 
      session.userId === userId && 
      session.isActive && 
      new Date(session.expiresAt) > now
    ).map(session => ({
      token: session.token,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      rememberMe: session.rememberMe,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    }));
  }
  
  // Cleanup method to be called on app shutdown
  destroy() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
      this.sessionCleanupInterval = null;
    }
  }
  
  // User profile management
  async updateUserProfile(userId, updates) {
    const users = this.getAllUsers();
    const user = users[userId];
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Handle password change
    if (updates.newPassword) {
      if (!updates.currentPassword) {
        throw new Error('현재 비밀번호가 필요합니다.');
      }
      
      // Verify current password
      // Simple password verification for development
      const isCurrentPasswordValid = (updates.currentPassword === user.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      }
      
      // Validate new password strength
      const passwordValidation = validatePasswordStrength(updates.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error('비밀번호 강도가 부족합니다: ' + passwordValidation.errors.join(', '));
      }
      
      // Store new password simply for development
      user.password = updates.newPassword;
    }
    
    // Handle email change
    if (updates.email && updates.email !== user.email) {
      if (!validateEmail(updates.email)) {
        throw new Error('유효한 이메일 주소를 입력해주세요.');
      }
      
      if (!this.isEmailUnique(updates.email)) {
        throw new Error('이미 사용 중인 이메일 주소입니다.');
      }
      
      user.email = updates.email;
      user.emailVerified = false; // Reset email verification
    }
    
    // Update other profile fields
    if (updates.displayName) user.displayName = updates.displayName;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    
    // Update preferences
    if (updates.preferences) {
      user.preferences = { ...user.preferences, ...updates.preferences };
    }
    
    user.updatedAt = new Date().toISOString();
    
    safeLocalStorage.setItem(this.usersKey, JSON.stringify(users));
    
    return this.getUser(userId);
  }
  
  // Get user activity summary
  getUserActivity(userId, days = 30) {
    const sessions = this.getUserSessions(userId);
    const stats = this.getUserStats(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSessions = sessions.filter(session => 
      new Date(session.createdAt) >= cutoffDate
    );
    
    const activityByDay = {};
    recentSessions.forEach(session => {
      const day = session.createdAt.split('T')[0];
      if (!activityByDay[day]) {
        activityByDay[day] = {
          sessions: 0,
          completed: 0,
          totalMinutes: 0,
          completedMinutes: 0
        };
      }
      
      activityByDay[day].sessions++;
      activityByDay[day].totalMinutes += session.duration;
      
      if (session.status === 'completed') {
        activityByDay[day].completed++;
        activityByDay[day].completedMinutes += session.duration;
      }
    });
    
    return {
      totalSessions: recentSessions.length,
      completedSessions: recentSessions.filter(s => s.status === 'completed').length,
      totalMinutes: recentSessions.reduce((sum, s) => sum + s.duration, 0),
      completedMinutes: recentSessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + s.duration, 0),
      activityByDay,
      currentStreak: stats.streakDays,
      longestStreak: stats.longestStreak
    };
  }

  deleteUser(userId) {
    if (!userId) return false;

    const users = this.getAllUsers();
    delete users[userId];
    safeLocalStorage.setItem(this.usersKey, JSON.stringify(users));

    const keysToDelete = [
      `userStats_${userId}`,
      `pomodoroSessions_${userId}`,
      `activePomodoroSession_${userId}`,
      `meetings_${userId}`
    ];

    keysToDelete.forEach(key => {
      safeLocalStorage.removeItem(key);
    });
    
    // Remove all sessions for this user
    const sessions = this.getSessions();
    Object.keys(sessions).forEach(token => {
      if (sessions[token].userId === userId) {
        delete sessions[token];
      }
    });
    safeLocalStorage.setItem(this.sessionsKey, JSON.stringify(sessions));

    return true;
  }

  // Meeting Management Methods
  getMeetings(userId) {
    const meetingsKey = `meetings_${userId}`;
    const meetings = safeLocalStorage.getItem(meetingsKey);
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
    safeLocalStorage.setItem(meetingsKey, JSON.stringify(meetings));
    
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
    safeLocalStorage.setItem(meetingsKey, JSON.stringify(meetings));
    
    return meetings[meetingIndex];
  }

  deleteMeeting(userId, meetingId) {
    const meetings = this.getMeetings(userId);
    const filteredMeetings = meetings.filter(meeting => meeting.id !== meetingId);
    
    const meetingsKey = `meetings_${userId}`;
    safeLocalStorage.setItem(meetingsKey, JSON.stringify(filteredMeetings));
    
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

  // Clear all user data from localStorage
  clearAllData() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    
    try {
      localStorage.clear();
      console.log('모든 사용자 데이터가 삭제되었습니다.');
      return true;
    } catch (error) {
      console.warn('데이터 삭제 중 오류:', error);
      return false;
    }
  }
}