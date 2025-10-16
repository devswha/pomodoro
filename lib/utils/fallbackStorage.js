/**
 * Fallback storage system for demo environment
 * When Supabase is not available, fall back to localStorage
 */

export class FallbackStorage {
  constructor() {
    this.isSupabaseAvailable = false;
    this.storagePrefix = 'pomodoro_fallback_';
  }

  // Check if we should use fallback mode
  shouldUseFallback() {
    // Only use fallback in explicit demo mode
    if (typeof window === 'undefined') return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    // Never use fallback if we have a real Supabase URL (not demo)
    if (supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('demo.supabase.co')) {
      return false;
    }

    // Only use fallback if explicitly in demo mode or demo URL
    return demoMode ||
           !supabaseUrl ||
           supabaseUrl.includes('demo.supabase.co') ||
           supabaseUrl === 'https://demo.supabase.co';
  }

  // Fallback user operations
  async checkUsernameExists(username) {
    if (!this.shouldUseFallback()) return false;

    try {
      const users = this.getStoredUsers();
      return Object.values(users).some(user => user.username === username);
    } catch (error) {
      console.error('Fallback username check error:', error);
      return false;
    }
  }

  async checkEmailExists(email) {
    if (!this.shouldUseFallback()) return false;

    try {
      const users = this.getStoredUsers();
      return Object.values(users).some(user => user.email === email);
    } catch (error) {
      console.error('Fallback email check error:', error);
      return false;
    }
  }

  async getUserByUsername(username) {
    if (!this.shouldUseFallback()) return null;

    try {
      const users = this.getStoredUsers();
      return Object.values(users).find(user => user.username === username) || null;
    } catch (error) {
      console.error('Fallback user lookup error:', error);
      return null;
    }
  }

  async createUser(userData) {
    if (!this.shouldUseFallback()) return null;

    try {
      const users = this.getStoredUsers();
      const userId = 'user_' + Date.now();
      const newUser = {
        id: userId,
        username: userData.username,
        email: userData.email,
        display_name: userData.displayName || userData.username,
        created_at: new Date().toISOString(),
        ...userData
      };

      users[userId] = newUser;
      this.setStoredUsers(users);

      console.log('✅ FALLBACK: User created successfully:', newUser);
      return newUser;
    } catch (error) {
      console.error('Fallback user creation error:', error);
      throw error;
    }
  }

  // Storage helpers
  getStoredUsers() {
    if (typeof window === 'undefined') return {};

    try {
      const stored = localStorage.getItem(this.storagePrefix + 'users');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading stored users:', error);
      return {};
    }
  }

  setStoredUsers(users) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storagePrefix + 'users', JSON.stringify(users));
    } catch (error) {
      console.error('Error storing users:', error);
    }
  }

  // Session helpers for demo mode
  async createDemoSession(userData, password) {
    if (!this.shouldUseFallback()) return null;

    try {
      // Create a demo session token
      const sessionToken = 'demo_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      const session = {
        access_token: sessionToken,
        user: userData,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        created_at: new Date().toISOString()
      };

      // Store session
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storagePrefix + 'current_session', JSON.stringify(session));
      }

      console.log('✅ FALLBACK: Demo session created');
      return session;
    } catch (error) {
      console.error('Fallback session creation error:', error);
      throw error;
    }
  }

  async validatePassword(storedUser, inputPassword) {
    if (!this.shouldUseFallback()) return false;

    try {
      // Simple password validation for demo mode
      // In real app, this would be properly hashed
      return storedUser.password === inputPassword ||
             storedUser.demo_password === inputPassword ||
             inputPassword === 'demo123'; // Demo password
    } catch (error) {
      console.error('Fallback password validation error:', error);
      return false;
    }
  }

  // Initialize demo data
  initializeDemoData() {
    if (!this.shouldUseFallback()) return;

    const existingUsers = this.getStoredUsers();

    // Add demo users if none exist
    if (Object.keys(existingUsers).length === 0) {
      const demoUsers = {
        'demo_user_test': {
          id: 'demo_user_test',
          username: 'test',
          email: 'test@demo.com',
          display_name: 'Test User',
          password: 'demo123',
          demo_password: 'demo123',
          created_at: new Date().toISOString()
        },
        'demo_user_test2': {
          id: 'demo_user_test2',
          username: 'test2',
          email: 'test2@demo.com',
          display_name: 'Test User 2',
          password: 'demo123',
          demo_password: 'demo123',
          created_at: new Date().toISOString()
        }
      };

      this.setStoredUsers(demoUsers);
      console.log('🚀 FALLBACK: Demo users initialized');
    }
  }
}

export const fallbackStorage = new FallbackStorage();