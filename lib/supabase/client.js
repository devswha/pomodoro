/**
 * Supabase Client Configuration
 * 
 * Server-side and client-side Supabase clients for the Pomodoro Timer application.
 * Configured for security with RLS (Row Level Security) policies.
 */

import { createClient } from '@supabase/supabase-js';

// Environment validation with localStorage fallback support
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for valid Supabase configuration
const isValidSupabaseUrl = (url) => {
  if (!url || url.includes('your_supabase') || url.includes('placeholder') || url.includes('demo.supabase.co')) {
    return false;
  }
  try {
    new URL(url);
    return url.includes('supabase.co');
  } catch {
    return false;
  }
};

const hasValidSupabaseConfig = isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey && !supabaseAnonKey.includes('your_');

console.log('Supabase Configuration Status:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  urlValid: isValidSupabaseUrl(supabaseUrl),
  anonKey: supabaseAnonKey ? 'Present' : 'Missing',
  anonKeyValid: supabaseAnonKey && !supabaseAnonKey.includes('your_'),
  hasValidConfig: hasValidSupabaseConfig,
});

// Create mock Supabase client for localStorage fallback mode
const createMockSupabaseClient = () => {
  const chainableMethods = {
    select: function() { return this; },
    insert: function() { return this; },
    update: function() { return this; },
    delete: function() { return this; },
    eq: function() { return this; },
    neq: function() { return this; },
    gt: function() { return this; },
    gte: function() { return this; },
    lt: function() { return this; },
    lte: function() { return this; },
    like: function() { return this; },
    ilike: function() { return this; },
    is: function() { return this; },
    in: function() { return this; },
    contains: function() { return this; },
    containedBy: function() { return this; },
    rangeGt: function() { return this; },
    rangeGte: function() { return this; },
    rangeLt: function() { return this; },
    rangeLte: function() { return this; },
    rangeAdjacent: function() { return this; },
    overlaps: function() { return this; },
    textSearch: function() { return this; },
    match: function() { return this; },
    not: function() { return this; },
    or: function() { return this; },
    filter: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    range: function() { return this; },
    abortSignal: function() { return this; },
    single: function() { return Promise.resolve({ data: null, error: { message: 'Using localStorage mode - no data available' } }); },
    maybeSingle: function() { return Promise.resolve({ data: null, error: null }); },
    then: function(resolve) { return resolve({ data: [], error: null }); },
    catch: function() { return this; },
  };
  
  return {
    from: () => chainableMethods,
    auth: {
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Using localStorage mode' } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Using localStorage mode' } }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Using localStorage mode' } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({
      on: function() { return this; },
      subscribe: () => Promise.resolve('SUBSCRIBED'),
      unsubscribe: () => {},
      track: () => Promise.resolve(),
      send: () => Promise.resolve(),
      presenceState: () => ({}),
    }),
    realtime: {
      disconnect: () => {},
    },
  };
};

// Client-side Supabase client (for browser usage)
export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createMockSupabaseClient();

// Server-side Supabase client (for API routes with elevated privileges)
export const supabaseAdmin = hasValidSupabaseConfig && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : createMockSupabaseClient();

// Export configuration status for components to check
export const isSupabaseEnabled = hasValidSupabaseConfig;

// Server-side client for API routes (with user context)
export const createServerSupabaseClient = (req, res) => {
  return hasValidSupabaseConfig 
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: req?.headers?.authorization || '',
          },
        },
      })
    : createMockSupabaseClient();
};

// Utility to get authenticated user from request
export const getAuthenticatedUser = async (req) => {
  if (!hasValidSupabaseConfig) {
    return { user: null, error: 'Using localStorage mode - no auth available' };
  }
  
  const authorization = req.headers.authorization;
  
  if (!authorization) {
    return { user: null, error: 'No authorization header' };
  }
  
  const token = authorization.replace('Bearer ', '');
  const serverClient = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: { user }, error } = await serverClient.auth.getUser(token);
    return { user, error };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Database table names for type safety
export const TABLES = {
  USERS: 'users',
  USER_PREFERENCES: 'user_preferences', 
  USER_STATS: 'user_stats',
  POMODORO_SESSIONS: 'pomodoro_sessions',
  MEETINGS: 'meetings',
  AUTH_SESSIONS: 'auth_sessions',
};

// Default configuration for queries
export const DEFAULT_QUERY_CONFIG = {
  count: 'exact',
  head: false,
};

/**
 * Helper function to handle Supabase errors consistently
 */
export const handleSupabaseError = (error, context = '') => {
  console.error(`Supabase error ${context}:`, error);
  
  if (error?.code === 'PGRST116') {
    return { success: false, error: 'Data not found', code: 404 };
  }
  
  if (error?.code === '23505') {
    return { success: false, error: 'Duplicate entry', code: 409 };
  }
  
  if (error?.code === '42501') {
    return { success: false, error: 'Insufficient permissions', code: 403 };
  }
  
  return { 
    success: false, 
    error: error?.message || 'Database operation failed',
    code: 500
  };
};

/**
 * Utility to safely parse JSON responses
 */
export const parseSupabaseResponse = (data, error, context = '') => {
  if (error) {
    return handleSupabaseError(error, context);
  }
  
  return {
    success: true,
    data,
    count: data?.length || (Array.isArray(data) ? data.length : 1)
  };
};

/**
 * Connection test utility
 */
export const testConnection = async () => {
  if (!hasValidSupabaseConfig) {
    return { 
      connected: false, 
      error: 'Using localStorage fallback mode - Supabase not configured',
      mode: 'localStorage' 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      return { connected: false, error: error.message };
    }
    
    return { connected: true, message: 'Supabase connection successful', mode: 'supabase' };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

export default supabase;