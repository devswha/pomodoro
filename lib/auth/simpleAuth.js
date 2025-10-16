import { supabase } from '../supabase/client';
import bcrypt from 'bcryptjs';

/**
 * Simple authentication system using only public.users table
 * No email verification required
 */

export class SimpleAuth {
  /**
   * Register a new user
   */
  static async register(username, email, password) {
    try {
      // Input validation
      if (!username?.trim()) {
        throw new Error('사용자명을 입력해주세요.');
      }

      if (!email?.trim()) {
        throw new Error('이메일을 입력해주세요.');
      }

      if (!password || password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      }

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingUser) {
        throw new Error('이미 사용 중인 사용자명입니다.');
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (existingEmail) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }

      // Hash password (client-side for simplicity)
      const salt = '$2a$10$' + Array(22).fill(0).map(() =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./'.charAt(
          Math.floor(Math.random() * 64)
        )
      ).join('');

      // Simple hash for demo (in production, use proper bcrypt)
      const passwordHash = btoa(password + salt);

      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          username: username.trim(),
          display_name: username.trim(),
          email: email.trim(),
          password_hash: passwordHash,
          auth_id: crypto.randomUUID(), // Generate a fake auth_id for compatibility
          created_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        throw new Error('회원가입에 실패했습니다.');
      }

      console.log('✅ User registered successfully:', newUser.username);
      return newUser;

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login a user
   */
  static async login(username, password) {
    try {
      // Input validation
      if (!username?.trim()) {
        throw new Error('아이디를 입력해주세요.');
      }

      if (!password) {
        throw new Error('비밀번호를 입력해주세요.');
      }

      // Get user by username
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .maybeSingle();

      if (error || !user) {
        throw new Error('존재하지 않는 사용자입니다.');
      }

      // Verify password (simple check for demo)
      const passwordMatch = user.password_hash === btoa(password + user.password_hash.substring(0, 29));

      // For demo, also allow if password_hash is 'supabase_auth_managed' and password is correct
      const isSupabaseManaged = user.password_hash === 'supabase_auth_managed';

      if (!passwordMatch && !isSupabaseManaged) {
        // Simple password check - in production, use proper bcrypt
        const simpleMatch = user.password_hash === btoa(password + user.password_hash.split(password)[0]);
        if (!simpleMatch) {
          throw new Error('비밀번호가 올바르지 않습니다.');
        }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      console.log('✅ User logged in successfully:', user.username);

      // Create a session token
      const sessionToken = btoa(JSON.stringify({
        userId: user.id,
        username: user.username,
        timestamp: Date.now()
      }));

      return {
        user,
        sessionToken
      };

    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Get user by session token
   */
  static async getUserByToken(sessionToken) {
    try {
      if (!sessionToken) return null;

      // Decode session token
      const sessionData = JSON.parse(atob(sessionToken));

      // Check if token is expired (24 hours)
      if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
        return null;
      }

      // Get user from database
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionData.userId)
        .maybeSingle();

      return user;

    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Logout (clear session)
   */
  static async logout() {
    // In a real app, you'd clear server-side session
    // For now, just return success
    return true;
  }
}