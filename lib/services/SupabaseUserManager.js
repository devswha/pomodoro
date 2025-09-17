/**
 * Supabase User Management System for Pomodoro Timer
 * Replaces localStorage-based UserManager with cloud database
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export class SupabaseUserManager {
  constructor() {
    this.maxLoginAttempts = 5
    this.accountLockTime = 30 * 60 * 1000 // 30 minutes
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutes
    this.extendedSessionTimeout = 7 * 24 * 60 * 60 * 1000 // 7 days
  }

  // =====================================================================================
  // AUTHENTICATION METHODS
  // =====================================================================================

  async registerUser(username, userData) {
    try {
      // Validate input data
      if (!username || typeof username !== 'string') {
        throw new Error('유효한 사용자명이 필요합니다.')
      }
      
      if (!userData.password) {
        throw new Error('비밀번호가 필요합니다.')
      }
      
      if (!userData.email) {
        throw new Error('이메일이 필요합니다.')
      }

      // Check if username is available
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim())
        .single()
      
      if (existingUser) {
        throw new Error('이미 존재하는 사용자명입니다.')
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: username.trim(),
            display_name: userData.displayName || username.trim()
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('이미 사용 중인 이메일 주소입니다.')
        }
        throw new Error(authError.message)
      }

      // Insert additional user data
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: username.trim(),
          display_name: userData.displayName || username.trim(),
          email: userData.email,
          password_hash: 'supabase_managed', // Supabase handles password hashing
          password_salt: 'supabase_managed',
          password_algorithm: 'supabase_pbkdf2',
          avatar: userData.avatar || null,
          bio: userData.bio || '',
          email_verified: false
        })

      if (insertError) {
        throw new Error('사용자 정보 저장에 실패했습니다.')
      }

      // Insert user preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: authData.user.id,
          default_pomodoro_length: userData.defaultPomodoroLength || 25,
          break_length: userData.breakLength || 5,
          long_break_length: userData.longBreakLength || 15,
          weekly_goal: userData.weeklyGoal || 140,
          theme: userData.theme || 'default',
          sound_enabled: userData.soundEnabled !== false,
          notifications_enabled: userData.notificationsEnabled !== false,
          auto_start_break: userData.autoStartBreak || false,
          auto_start_pomodoro: userData.autoStartPomodoro || false
        })

      if (prefsError) {
        console.warn('Failed to create user preferences:', prefsError)
      }

      return {
        id: authData.user.id,
        username: username.trim(),
        displayName: userData.displayName || username.trim(),
        email: userData.email,
        createdAt: authData.user.created_at
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  async loginUser(username, password, rememberMe = false) {
    try {
      if (!username || !password) {
        throw new Error('사용자명과 비밀번호가 필요합니다.')
      }

      // Get user email by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, is_locked, login_attempts, last_failed_login')
        .eq('username', username.trim())
        .single()

      if (userError || !userData) {
        throw new Error('존재하지 않는 사용자입니다.')
      }

      // Check if account is locked
      if (userData.is_locked) {
        const lockExpiry = new Date(userData.last_failed_login)
        lockExpiry.setTime(lockExpiry.getTime() + this.accountLockTime)
        
        if (new Date() < lockExpiry) {
          const remainingTime = Math.ceil((lockExpiry - new Date()) / (60 * 1000))
          throw new Error(`계정이 일시적으로 잠겼습니다. ${remainingTime}분 후에 다시 시도해주세요.`)
        }
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password
      })

      if (authError) {
        // Handle failed login attempt
        await this.handleFailedLogin(username)
        
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('비밀번호가 올바르지 않습니다.')
        }
        throw new Error('로그인에 실패했습니다.')
      }

      // Reset failed attempts on successful login
      await supabase
        .from('users')
        .update({
          login_attempts: 0,
          last_failed_login: null,
          is_locked: false,
          last_login: new Date().toISOString()
        })
        .eq('username', username.trim())

      // Get complete user data
      const user = await this.getUser(authData.user.id)
      
      return {
        user: user,
        sessionToken: authData.session.access_token
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  async handleFailedLogin(username) {
    const { data: userData } = await supabase
      .from('users')
      .select('login_attempts')
      .eq('username', username)
      .single()

    const newAttempts = (userData?.login_attempts || 0) + 1
    const isLocked = newAttempts >= this.maxLoginAttempts

    await supabase
      .from('users')
      .update({
        login_attempts: newAttempts,
        last_failed_login: new Date().toISOString(),
        is_locked: isLocked
      })
      .eq('username', username)
  }

  async logoutUser() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      return true
    } catch (error) {
      console.error('Logout failed:', error)
      return false
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      return await this.getUser(user.id)
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  // =====================================================================================
  // USER DATA METHODS
  // =====================================================================================

  async getUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, username, display_name, email, avatar, bio, 
          email_verified, created_at, last_login,
          user_preferences (*)
        `)
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        email: data.email,
        avatar: data.avatar,
        bio: data.bio,
        emailVerified: data.email_verified,
        createdAt: data.created_at,
        lastLogin: data.last_login,
        preferences: data.user_preferences?.[0] || {}
      }
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const { error: userError } = await supabase
        .from('users')
        .update({
          display_name: updates.displayName,
          avatar: updates.avatar,
          bio: updates.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (userError) {
        throw userError
      }

      // Update preferences if provided
      if (updates.preferences) {
        const { error: prefsError } = await supabase
          .from('user_preferences')
          .update({
            ...updates.preferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (prefsError) {
          console.warn('Failed to update preferences:', prefsError)
        }
      }

      return await this.getUser(userId)
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }

  // =====================================================================================
  // STATISTICS METHODS
  // =====================================================================================

  async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        throw error
      }

      return {
        userId: data.user_id,
        totalSessions: data.total_sessions,
        completedSessions: data.completed_sessions,
        totalMinutes: data.total_minutes,
        completedMinutes: data.completed_minutes,
        streakDays: data.streak_days,
        longestStreak: data.longest_streak,
        lastSessionDate: data.last_session_date,
        weeklyGoal: data.weekly_goal || 140,
        monthlyStats: data.monthly_stats || {},
        dailyStats: data.daily_stats || {},
        tags: data.tags || {},
        locations: data.locations || {},
        completionRate: data.completion_rate,
        averageSessionLength: data.average_session_length,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Failed to get user stats:', error)
      return null
    }
  }

  async updateUserStats(userId, updates) {
    try {
      const { error } = await supabase
        .from('user_stats')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return await this.getUserStats(userId)
    } catch (error) {
      console.error('Failed to update user stats:', error)
      throw error
    }
  }

  // =====================================================================================
  // POMODORO SESSION METHODS
  // =====================================================================================

  async createPomodoroSession(userId, sessionData) {
    try {
      const { data, error } = await supabase
        .rpc('start_pomodoro_session', {
          p_user_id: userId,
          p_title: sessionData.title || 'Pomodoro Session',
          p_goal: sessionData.goal || '',
          p_tags: sessionData.tags || '',
          p_location: sessionData.location || '',
          p_duration: sessionData.duration || 25,
          p_scheduled_time: sessionData.scheduledTime || null
        })

      if (error) {
        throw error
      }

      // Get the created session
      return await this.getActiveSession(userId)
    } catch (error) {
      console.error('Failed to create pomodoro session:', error)
      throw error
    }
  }

  async getActiveSession(userId) {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // No rows found
        throw error
      }

      if (!data) {
        return null
      }

      return {
        id: data.id,
        title: data.title,
        goal: data.goal,
        tags: data.tags,
        location: data.location,
        duration: data.duration,
        startTime: data.start_time,
        endTime: data.end_time,
        user: data.user_id,
        status: data.status,
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('Failed to get active session:', error)
      return null
    }
  }

  async completePomodoroSession(userId, sessionId) {
    try {
      const { data, error } = await supabase
        .rpc('complete_pomodoro_session', {
          p_user_id: userId,
          p_session_id: sessionId
        })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to complete pomodoro session:', error)
      throw error
    }
  }

  async stopPomodoroSession(userId, sessionId) {
    try {
      const { error } = await supabase
        .from('pomodoro_sessions')
        .update({
          status: 'stopped',
          is_active: false,
          stopped_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // Update statistics
      await supabase.rpc('update_user_statistics', { p_user_id: userId })

      return true
    } catch (error) {
      console.error('Failed to stop pomodoro session:', error)
      throw error
    }
  }

  async getUserSessions(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data.map(session => ({
        id: session.id,
        title: session.title,
        goal: session.goal,
        tags: session.tags,
        location: session.location,
        duration: session.duration,
        startTime: session.start_time,
        endTime: session.end_time,
        completedAt: session.completed_at,
        stoppedAt: session.stopped_at,
        user: session.user_id,
        status: session.status,
        createdAt: session.created_at
      }))
    } catch (error) {
      console.error('Failed to get user sessions:', error)
      return []
    }
  }

  // =====================================================================================
  // MEETING METHODS
  // =====================================================================================

  async getMeetings(userId) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .order('meeting_date', { ascending: true })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get meetings:', error)
      return []
    }
  }

  async saveMeeting(userId, meeting) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          user_id: userId,
          title: meeting.title,
          description: meeting.description || '',
          location: meeting.location || '',
          meeting_date: meeting.date,
          meeting_time: meeting.time,
          duration: meeting.duration || 60,
          status: 'scheduled',
          agenda: meeting.agenda || '',
          notes: meeting.notes || ''
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to save meeting:', error)
      throw error
    }
  }

  async updateMeeting(userId, meetingId, updates) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to update meeting:', error)
      throw error
    }
  }

  async deleteMeeting(userId, meetingId) {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Failed to delete meeting:', error)
      throw error
    }
  }

  // =====================================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================================================

  subscribeToUserSessions(userId, callback) {
    return supabase
      .channel(`user_sessions_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pomodoro_sessions',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  subscribeToUserStats(userId, callback) {
    return supabase
      .channel(`user_stats_${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_stats',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  subscribeToMeetings(userId, callback) {
    return supabase
      .channel(`meetings_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meetings',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        throw error
      }

      // Also delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.warn('Failed to delete auth user:', authError)
      }

      return true
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }

  async getUserActivity(userId, days = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_activity_summary', {
          p_user_id: userId,
          p_days: days
        })

      if (error) {
        throw error
      }

      return data[0] || null
    } catch (error) {
      console.error('Failed to get user activity:', error)
      return null
    }
  }
}

export default SupabaseUserManager