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

  useEffect(() => {
    // 페이지 로드 시 저장된 사용자 정보 복원
    const savedUserId = localStorage.getItem('currentUser');
    if (savedUserId) {
      const user = userManager.getUser(savedUserId);
      if (user) {
        setCurrentUser(user);
        checkActiveSession(savedUserId);
      }
    }
  }, [userManager]);

  const loginUser = (userId, userData = {}) => {
    try {
      const user = userManager.loginUser(userId, userData);
      setCurrentUser(user);
      localStorage.setItem('currentUser', userId);
      checkActiveSession(userId);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setActiveSession(null);
    localStorage.removeItem('currentUser');
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

  const value = {
    currentUser,
    activeSession,
    loginUser,
    logoutUser,
    createPomodoroSession,
    completePomodoroSession,
    stopPomodoroSession,
    getUserStats,
    getUserSessions,
    userManager
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};