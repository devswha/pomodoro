'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

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

  const loginUser = async (userId, password) => {
    try {
      setAuthLoading(true);

      // Input validation
      if (!userId?.trim()) {
        throw new Error('아이디를 입력해주세요.');
      }

      if (!password) {
        throw new Error('비밀번호를 입력해주세요.');
      }

      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', userId.trim())
        .maybeSingle();

      if (!user) {
        throw new Error('존재하지 않는 사용자입니다.');
      }

      // For demo purposes, accept any password for existing users
      // In production, you'd verify the password hash properly
      console.log('✅ LOGIN: User found:', user.username);

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Create session
      const sessionToken = btoa(JSON.stringify({
        userId: user.id,
        username: user.username,
        timestamp: Date.now()
      }));

      // Store in state and localStorage
      setCurrentUser(user);
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

      // Input validation
      if (!userId?.trim()) {
        throw new Error('사용자명을 입력해주세요.');
      }

      if (!userData?.email?.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }

      if (!userData?.password || userData.password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      }

      console.log(`🔍 SIGNUP: Starting registration for '${userId.trim()}'`);

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', userId.trim())
        .maybeSingle();

      if (existingUser) {
        throw new Error('이미 사용 중인 사용자명입니다.');
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email.trim())
        .maybeSingle();

      if (existingEmail) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }

      // Create user in database (no email verification needed)
      const newUserId = crypto.randomUUID();
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: newUserId,
          auth_id: newUserId, // Use same ID for compatibility
          username: userId.trim(),
          display_name: userData.displayName || userId.trim(),
          email: userData.email.trim(),
          password_hash: btoa(userData.password), // Simple encoding for demo
          created_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        throw new Error('회원가입에 실패했습니다.');
      }

      console.log('✅ SIGNUP: User created successfully:', newUser.username);

      // Auto-login after registration
      const sessionToken = btoa(JSON.stringify({
        userId: newUser.id,
        username: newUser.username,
        timestamp: Date.now()
      }));

      // Store in state and localStorage
      setCurrentUser(newUser);
      setSessionToken(sessionToken);
      setIsSessionValid(true);

      localStorage.setItem('sessionToken', sessionToken);
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      return newUser;

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
        .from('pomodoro_sessions')
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
    loadActiveSession
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};