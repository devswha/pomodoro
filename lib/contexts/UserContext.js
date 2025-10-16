'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { UserManager, validateUsername as defaultValidateUsername, validateEmail as defaultValidateEmail, validatePasswordStrength as defaultValidatePasswordStrength } from '../services/UserManager.js';

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
  const [activeSession, setActiveSession] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(null);

  const userManager = useMemo(() => new UserManager(), []);

  // Initialize from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthLoading(true);

        // Check localStorage first
        const storedToken = localStorage.getItem('sessionToken');
        const storedUser = localStorage.getItem('currentUser');

        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          setSessionToken(storedToken);
          setIsSessionValid(true);
        }

        setAuthLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginUser = async (userId, password, rememberMe = false) => {
    try {
      setAuthLoading(true);

      // Input validation
      if (!userId?.trim()) {
        throw new Error('아이디를 입력해주세요.');
      }

      if (!password) {
        throw new Error('비밀번호를 입력해주세요.');
      }

      console.log(`🔐 LOGIN: Attempting login for '${userId.trim()}'`);

      // Call login API for proper password verification
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userId.trim(),
          password: password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '아이디 또는 비밀번호가 올바르지 않습니다.');
      }

      console.log('✅ LOGIN: Authentication successful');

      const user = result.user;
      const sessionToken = result.token;

      // Store in state and localStorage
      setCurrentUser({
        ...user,
        display_name: user.display_name || user.username || user.id,
        username: user.username || user.id
      });
      setSessionToken(sessionToken);
      setIsSessionValid(true);

      localStorage.setItem('sessionToken', sessionToken);
      localStorage.setItem('currentUser', JSON.stringify(user));

      return user;

    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const registerUser = async (userId, userData) => {
    try {
      setAuthLoading(true);

      if (!userId?.trim()) {
        throw new Error('사용자명을 입력해주세요.');
      }

      if (!userData?.email?.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }

      if (!userData?.password || userData.password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userId.trim(),
          displayName: userData.displayName?.trim(),
          email: userData.email.trim(),
          password: userData.password,
          confirmPassword: userData.confirmPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '회원가입에 실패했습니다.');
      }

      return {
        ...result.user,
        display_name: result.user?.display_name || result.user?.username || result.user?.id,
        username: result.user?.username || result.user?.id
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('currentUser');

      // Clear state
      setCurrentUser(null);
      setActiveSession(null);
      setSessionToken(null);
      setIsSessionValid(false);
      setSessionWarning(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadActiveSession = async (userId) => {
    try {
      const { data: sessions } = await supabase
        .from('step_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        setActiveSession(sessions[0]);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  };

  const createSTEPSession = async (sessionData) => {
    try {
      if (!currentUser) {
        throw new Error('User not logged in');
      }

      // Prepare session data with all fields
      const insertData = {
        user_id: currentUser.id,
        title: sessionData.title || 'STEP Session',
        duration: sessionData.duration || 25,
        start_time: sessionData.scheduledTime || new Date().toISOString(),
        status: 'active',
        is_active: true,
        session_type: 'step'  // Required field due to CHECK constraint
      };

      // Add goal if provided
      if (sessionData.goal) {
        insertData.goal = sessionData.goal;
      }

      console.log('Inserting STEP session data:', insertData);

      const { data: session, error } = await supabase
        .from('step_sessions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating session:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      setActiveSession(session);
      return session;
    } catch (error) {
      console.error('Error creating STEP session:', error);
      throw error;
    }
  };

  const stopSTEPSession = async () => {
    try {
      if (!activeSession) return;

      const { error } = await supabase
        .from('step_sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
          is_active: false
        })
        .eq('id', activeSession.id);

      if (error) throw error;

      setActiveSession(null);
    } catch (error) {
      console.error('Error stopping STEP session:', error);
    }
  };

  const validateUsername = (username) => defaultValidateUsername(username);
  const validateEmail = (email) => defaultValidateEmail(email);
  const checkPasswordStrength = (password) => defaultValidatePasswordStrength(password);

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
    setActiveSession,
    loadActiveSession,
    createSTEPSession,
    stopSTEPSession,
    userManager,
    validateUsername,
    validateEmail,
    checkPasswordStrength
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};