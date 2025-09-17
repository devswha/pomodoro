'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserManager } from '../services/UserManager';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userManager] = useState(() => new UserManager());
  const [activeSession, setActiveSession] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(null);

  useEffect(() => {
    // Check for existing session on page load
    const initializeAuth = async () => {
      try {
        const currentSession = userManager.getCurrentSession();
        if (currentSession) {
          const user = userManager.getUser(currentSession.userId);
          if (user) {
            setCurrentUser(user);
            setSessionToken(currentSession.token);
            setIsSessionValid(true);
            checkActiveSession(currentSession.userId);
          } else {
            // User doesn't exist but session does, clean up
            userManager.logoutSession();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        userManager.logoutSession();
      } finally {
        setAuthLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up session validation interval with warning system
    const sessionCheckInterval = setInterval(() => {
      if (sessionToken) {
        const session = userManager.validateSession(sessionToken);
        if (!session) {
          // Session expired, logout
          setSessionWarning('세션이 만료되어 자동으로 로그아웃됩니다.');
          setTimeout(() => logoutUser(), 3000); // 3 second delay
        } else {
          // Check if session is about to expire (5 minutes warning)
          const expiresAt = new Date(session.expiresAt);
          const now = new Date();
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          
          if (timeUntilExpiry > 0 && timeUntilExpiry <= 5 * 60 * 1000 && !session.rememberMe) {
            setSessionWarning(`세션이 ${Math.ceil(timeUntilExpiry / (60 * 1000))}분 후 만료됩니다.`);
          } else {
            setSessionWarning(null);
          }
        }
      }
    }, 30000); // Check every 30 seconds for better UX
    
    return () => clearInterval(sessionCheckInterval);
  }, [userManager, sessionToken]);

  const loginUser = async (userId, password, rememberMe = false) => {
    try {
      setAuthLoading(true);
      setSessionWarning(null); // Clear any previous warnings
      
      // Input validation
      if (!userId?.trim()) {
        throw new Error('사용자명을 입력해주세요.');
      }
      
      if (!password) {
        throw new Error('비밀번호를 입력해주세요.');
      }
      
      const loginResult = await userManager.loginUser(userId.trim(), password, rememberMe);
      
      setCurrentUser(loginResult.user);
      setSessionToken(loginResult.sessionToken);
      setIsSessionValid(true);
      
      checkActiveSession(loginResult.user.id);
      
      return loginResult.user;
    } catch (error) {
      console.error('Login failed:', error);
      // Enhanced error handling with user-friendly messages
      if (error.message.includes('존재하지 않는')) {
        throw new Error('존재하지 않는 사용자입니다. 사용자명을 확인해주세요.');
      } else if (error.message.includes('비밀번호가 올바르지')) {
        throw error; // Keep the detailed message from UserManager
      } else if (error.message.includes('일시적으로 잠겼습니다')) {
        throw error; // Keep the lock message from UserManager
      } else {
        throw new Error('로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.');
      }
    } finally {
      setAuthLoading(false);
    }
  };
  
  const registerUser = async (userId, userData) => {
    try {
      setAuthLoading(true);
      setSessionWarning(null); // Clear any previous warnings
      
      // Enhanced input validation
      if (!userId?.trim()) {
        throw new Error('사용자명을 입력해주세요.');
      }
      
      if (!userData?.email?.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }
      
      if (!userData?.password) {
        throw new Error('비밀번호를 입력해주세요.');
      }
      
      const user = await userManager.registerUser(userId.trim(), {
        ...userData,
        email: userData.email.trim()
      });
      
      // Registration successful - return user without auto-login
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      // Enhanced error handling for registration
      if (error.message.includes('이미 존재하는')) {
        throw new Error('이미 사용 중인 사용자명입니다. 다른 사용자명을 선택해주세요.');
      } else if (error.message.includes('이미 사용 중인 이메일')) {
        throw new Error('이미 사용 중인 이메일 주소입니다. 다른 이메일을 사용해주세요.');
      } else if (error.message.includes('비밀번호')) {
        throw error; // Keep detailed password error messages
      } else if (error.message.includes('이메일')) {
        throw error; // Keep detailed email error messages
      } else if (error.message.includes('사용자명')) {
        throw error; // Keep detailed username error messages
      } else {
        throw new Error('회원가입에 실패했습니다. 입력 정보를 확인하고 다시 시도해주세요.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutUser = () => {
    try {
      userManager.logoutSession(sessionToken);
      setCurrentUser(null);
      setActiveSession(null);
      setSessionToken(null);
      setIsSessionValid(false);
      setSessionWarning(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the client state
      setCurrentUser(null);
      setActiveSession(null);
      setSessionToken(null);
      setIsSessionValid(false);
      setSessionWarning(null);
    }
  };

  const checkActiveSession = (userId) => {
    const session = userManager.getActiveSession(userId);
    if (session) {
      const now = new Date();
      const endTime = new Date(session.endTime);
      
      if (now < endTime) {
        setActiveSession(session);
      } else {
        // 만료된 세션 정리
        userManager.clearActiveSession(userId);
        setActiveSession(null);
      }
    }
  };

  const createPomodoroSession = (sessionData) => {
    if (!currentUser) throw new Error('No user logged in');
    
    const session = userManager.createPomodoroSession(currentUser.id, sessionData);
    setActiveSession(session);
    return session;
  };

  const completePomodoroSession = () => {
    if (!currentUser || !activeSession) return;
    
    userManager.completePomodoroSession(currentUser.id, activeSession.id);
    setActiveSession(null);
  };

  const stopPomodoroSession = () => {
    if (!currentUser || !activeSession) return;
    
    userManager.stopPomodoroSession(currentUser.id, activeSession.id);
    setActiveSession(null);
  };

  const getUserStats = () => {
    if (!currentUser) return null;
    return userManager.getUserStats(currentUser.id);
  };

  const getUserSessions = () => {
    if (!currentUser) return [];
    return userManager.getUserSessions(currentUser.id);
  };
  
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      const updatedUser = await userManager.updateUserProfile(currentUser.id, updates);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };
  
  const getUserActivity = (days = 30) => {
    if (!currentUser) return null;
    return userManager.getUserActivity(currentUser.id, days);
  };
  
  const validateCurrentSession = () => {
    if (!sessionToken) return false;
    const session = userManager.validateSession(sessionToken);
    if (!session) {
      logoutUser();
      return false;
    }
    return true;
  };
  
  // Enhanced password strength validation helper
  const checkPasswordStrength = (password) => {
    if (!password) {
      return {
        isValid: false,
        errors: ['비밀번호를 입력해주세요'],
        warnings: [],
        score: 0,
        strength: 'weak'
      };
    }
    
    const errors = [];
    const warnings = [];
    
    // Only basic length requirement
    if (password.length < 4) {
      errors.push('비밀번호는 4자 이상이어야 합니다');
    }
    
    // Simple strength calculation based on length only
    let score = Math.min(password.length * 10, 100);
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
  
  // Simplified email validation helper
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
  
  // Username validation helper
  const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
      return {
        isValid: false,
        error: '사용자명을 입력해주세요.'
      };
    }
    
    const trimmedUsername = username.trim();
    
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
    
    return {
      isValid: true,
      normalizedUsername: trimmedUsername.toLowerCase()
    };
  };
  
  // Session management helpers
  const extendSession = () => {
    if (sessionToken) {
      const session = userManager.validateSession(sessionToken);
      if (session) {
        setSessionWarning(null);
        return true;
      }
    }
    return false;
  };
  
  const dismissSessionWarning = () => {
    setSessionWarning(null);
  };

  const value = {
    currentUser,
    activeSession,
    sessionToken,
    isSessionValid,
    authLoading,
    sessionWarning,
    loginUser,
    registerUser,
    logoutUser,
    createPomodoroSession,
    completePomodoroSession,
    stopPomodoroSession,
    getUserStats,
    getUserSessions,
    updateUserProfile,
    getUserActivity,
    validateCurrentSession,
    checkPasswordStrength,
    validateEmail,
    validateUsername,
    extendSession,
    dismissSessionWarning,
    userManager
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};