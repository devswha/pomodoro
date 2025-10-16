'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { fallbackStorage } from '../utils/fallbackStorage';
import { SimpleAuth } from '../auth/simpleAuth';

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

  // Helper function to load full user profile from database
  const loadUserProfile = async (authUser) => {
    if (!authUser) return null;

    try {
      console.log('Loading user profile for auth ID:', authUser.id);

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authUser.id},email.eq.${authUser.email}`)
        .maybeSingle();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      if (profile) {
        console.log('User profile loaded:', profile.username);
        // Merge auth user data with profile data
        return {
          ...authUser,
          ...profile,
          authId: authUser.id // Keep original auth ID
        };
      }

      console.log('No user profile found for auth user');
      return authUser; // Return auth user if no profile found
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return authUser;
    }
  };

  useEffect(() => {
    // Initialize Supabase auth
    const initializeAuth = async () => {
      try {
        setAuthLoading(true);

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setAuthLoading(false);
          return;
        }

        if (session) {
          // Load full user profile from database
          const userProfile = await loadUserProfile(session.user);
          setCurrentUser(userProfile);
          setSessionToken(session.access_token);
          setIsSessionValid(true);
          await loadActiveSession(userProfile?.id || session.user.id);
        }

        setAuthLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);

        if (event === 'SIGNED_IN' && session) {
          // Load full user profile from database
          const userProfile = await loadUserProfile(session.user);
          setCurrentUser(userProfile);
          setSessionToken(session.access_token);
          setIsSessionValid(true);
          setSessionWarning(null);
          await loadActiveSession(userProfile?.id || session.user.id);
        } else if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null);
          setActiveSession(null);
          setSessionToken(null);
          setIsSessionValid(false);
          setSessionWarning(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loginUser = async (userId, password) => {
    try {
      setAuthLoading(true);
      setSessionWarning(null);

      // Input validation
      if (!userId?.trim()) {
        throw new Error('아이디를 입력해주세요.');
      }

      if (!password) {
        throw new Error('비밀번호를 입력해주세요.');
      }

      // First check if user exists by looking up username
      console.log(`🔍 LOGIN: Looking up username '${userId.trim()}'`);

      const { data: users, error: lookupError } = await supabase
        .from('users')
        .select('email, id, auth_id, username, display_name')
        .eq('username', userId.trim())
        .maybeSingle();

      console.log('📊 LOGIN: Query result:', { users, lookupError });

      if (!users) {
        console.log('❌ LOGIN: User not found in public.users table');

        // Try fallback storage for demo mode
        if (fallbackStorage.shouldUseFallback()) {
          console.log('🔄 LOGIN: Using fallback storage');
          const fallbackUser = await fallbackStorage.getUserByUsername(userId.trim());

          if (fallbackUser) {
            console.log('✅ LOGIN: User found in fallback storage');

            // Validate password
            const isValidPassword = await fallbackStorage.validatePassword(fallbackUser, password);
            if (!isValidPassword) {
              throw new Error('비밀번호가 올바르지 않습니다.');
            }

            // Create demo session
            const demoSession = await fallbackStorage.createDemoSession(fallbackUser, password);
            return {
              user: fallbackUser,
              sessionToken: demoSession.access_token
            };
          }
        }

        throw new Error('존재하지 않는 사용자입니다. 회원가입을 먼저 완료해주세요.');
      }

      console.log('✅ LOGIN: User found, email:', users.email, 'auth_id:', users.auth_id);

      // Login with email and password using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: users.email,
        password: password
      });

      if (authError) {
        console.error('❌ LOGIN: Auth error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('비밀번호가 올바르지 않습니다.');
        }
        throw new Error('로그인에 실패했습니다: ' + authError.message);
      }

      // Verify auth_id matches (for data integrity)
      if (users.auth_id && authData.user.id !== users.auth_id) {
        console.error('⚠️ LOGIN: Auth ID mismatch!', {
          authUserId: authData.user.id,
          storedAuthId: users.auth_id
        });
        // Still allow login but log the discrepancy for investigation
      }

      console.log('✅ LOGIN: Successfully authenticated');

      // Update last_login timestamp
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', users.id);

      if (updateError) {
        console.error('⚠️ LOGIN: Failed to update last_login:', updateError);
        // Non-critical error, don't block login
      }

      // Merge auth user with profile data
      const fullUserProfile = {
        ...authData.user,
        ...users,
        authId: authData.user.id
      };

      // Set the current user with full profile
      setCurrentUser(fullUserProfile);

      return fullUserProfile;
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
      setSessionWarning(null);

      // Input validation
      if (!userId?.trim()) {
        throw new Error('사용자명을 입력해주세요.');
      }

      if (!userData?.email?.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }

      if (!userData?.password) {
        throw new Error('비밀번호를 입력해주세요.');
      }

      // Check if username already exists
      console.log(`🔍 SIGNUP: Checking username '${userId.trim()}'`);

      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', userId.trim())
        .maybeSingle();

      if (existingUser) {
        console.log('❌ SIGNUP: Username already exists');
        throw new Error('이미 사용 중인 사용자명입니다.');
      }

      // Check if email already exists
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email.trim())
        .maybeSingle();

      if (existingEmail) {
        console.log('❌ SIGNUP: Email already exists');
        throw new Error('이미 사용 중인 이메일입니다.');
      }

      console.log('✅ SIGNUP: Username and email available');

      // Step 1: Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          data: {
            username: userId.trim(),
            display_name: userData.displayName || userId.trim()
          }
        }
      });

      if (authError) {
        console.error('❌ SIGNUP: Auth error:', authError);
        if (authError.message.includes('already registered')) {
          throw new Error('이미 등록된 이메일입니다.');
        }
        throw new Error('회원가입 실패: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('사용자 생성에 실패했습니다.');
      }

      console.log('✅ SIGNUP: Auth user created, ID:', authData.user.id);

      // Step 2: Create user profile in public.users table with auth_id
      try {
        const { data: newUser, error: profileError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,  // Link to Supabase Auth
            username: userId.trim(),
            display_name: userData.displayName || userId.trim(),
            email: userData.email.trim(),
            password_hash: 'supabase_auth_managed',
            created_at: new Date().toISOString(),
            is_active: true
          })
          .select()
          .single();

        if (profileError) {
          console.error('❌ SIGNUP: Profile creation error:', profileError);

          // Try to clean up auth user if profile creation fails
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }

          if (profileError.code === '23505') {
            throw new Error('사용자명 또는 이메일이 이미 사용중입니다.');
          }
          throw new Error('프로필 생성 실패: ' + profileError.message);
        }

        console.log('✅ SIGNUP: User profile created:', newUser);

        // Step 3: Auto-login the user after successful registration
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: userData.email.trim(),
          password: userData.password
        });

        if (loginError) {
          console.error('⚠️ SIGNUP: Auto-login failed:', loginError);
          // Not critical - user can manually login
        } else {
          console.log('✅ SIGNUP: Auto-login successful');
          // Merge auth user with profile data for consistency
          const fullUserProfile = {
            ...loginData.user,
            ...newUser,
            authId: loginData.user.id
          };
          setCurrentUser(fullUserProfile);
          setSessionToken(loginData.session?.access_token || null);
        }

        return newUser;

      } catch (profileError) {
        console.error('❌ SIGNUP: Profile creation failed:', profileError);
        throw profileError;
      }

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear client state
      setCurrentUser(null);
      setActiveSession(null);
      setSessionToken(null);
      setIsSessionValid(false);
      setSessionWarning(null);
    }
  };

  const loadActiveSession = async (userId) => {
    try {
      const { data: sessions, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading active session:', error);
        return;
      }

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const now = new Date();
        const endTime = new Date(session.end_time);

        if (now < endTime) {
          setActiveSession(session);
        } else {
          // Mark expired session as inactive
          await supabase
            .from('pomodoro_sessions')
            .update({ is_active: false, status: 'expired' })
            .eq('id', session.id);
          setActiveSession(null);
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const createPomodoroSession = async (sessionData) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const { data: session, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: currentUser.id,
          title: sessionData.title || '뽀모도로 세션',
          duration: sessionData.duration || 25,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + (sessionData.duration || 25) * 60 * 1000).toISOString(),
          status: 'active',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw new Error('세션 생성에 실패했습니다.');
      }

      setActiveSession(session);
      return session;
    } catch (error) {
      console.error('Error creating pomodoro session:', error);
      throw error;
    }
  };

  const completePomodoroSession = async () => {
    if (!currentUser || !activeSession) return;

    try {
      const { error } = await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'completed',
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      if (error) {
        console.error('Error completing session:', error);
        return;
      }

      setActiveSession(null);
    } catch (error) {
      console.error('Error completing pomodoro session:', error);
    }
  };

  const stopPomodoroSession = async () => {
    if (!currentUser || !activeSession) return;

    try {
      const { error } = await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'stopped',
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      if (error) {
        console.error('Error stopping session:', error);
        return;
      }

      setActiveSession(null);
    } catch (error) {
      console.error('Error stopping pomodoro session:', error);
    }
  };

  const getUserStats = async () => {
    if (!currentUser) return null;

    try {
      const { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error getting user stats:', error);
        return null;
      }

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  };

  const getUserSessions = async () => {
    if (!currentUser) return [];

    try {
      const { data: sessions, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error getting user sessions:', error);
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  };
  
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No user logged in');

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw new Error('프로필 업데이트에 실패했습니다.');
      }

      // Update current user state
      setCurrentUser({ ...currentUser, ...updatedUser });
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };
  
  const getUserActivity = async (days = 30) => {
    if (!currentUser) return null;

    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('start_time', fromDate.toISOString())
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error getting user activity:', error);
        return null;
      }

      return sessions || [];
    } catch (error) {
      console.error('Error getting user activity:', error);
      return null;
    }
  };
  
  const validateCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        await logoutUser();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      await logoutUser();
      return false;
    }
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
  const extendSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        return false;
      }

      setSessionWarning(null);
      return true;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
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
    dismissSessionWarning
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};