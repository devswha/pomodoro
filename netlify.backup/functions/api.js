/**
 * Netlify Functions Handler for API Routes
 *
 * This function handles all API requests for the STEP Timer application
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Helper function to validate authentication
async function validateAuth(headers) {
  const token = headers['x-user-token'] || headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return { isValid: false, error: 'No authentication token provided' };
  }

  try {
    // Check if token exists in auth_sessions
    const { data: session, error } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return { isValid: false, error: 'Invalid or expired token' };
    }

    return { isValid: true, userId: session.user_id, session };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { isValid: false, error: 'Authentication error' };
  }
}

// Main handler function
export const handler = async (event, context) => {
  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // 상세 디버깅 로그
    console.log('=== Netlify Function Debug ===');
    console.log('Raw event.path:', event.path);
    console.log('event.httpMethod:', event.httpMethod);

    const path = event.path.replace(/^\/\.netlify\/functions\/api\//, '').replace(/^\/api\//, '');
    const method = event.httpMethod.toUpperCase();
    const headers = event.headers;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};

    console.log(`Parsed path: ${path}`);
    console.log(`API Request: ${method} ${path}`);
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    // Route handling
    let response = {};

    // Auth routes (no authentication required)
    if (path === 'auth/login' && method === 'POST') {
      const { username, password } = body;

      // First check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !user) {
        return {
          statusCode: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid credentials' }),
        };
      }

      // For simplicity, accept any password (in production, use proper password hashing)
      // Create session
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data: session, error: sessionError } = await supabase
        .from('auth_sessions')
        .insert([{
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          is_active: true
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return {
          statusCode: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Failed to create session' }),
        };
      }

      response = {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token: sessionToken
      };

    } else if (path === 'auth/signup' && method === 'POST') {
      const { username, email, password } = body;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .single();

      if (existingUser) {
        return {
          statusCode: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Username or email already exists' }),
        };
      }

      // Create user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          username,
          email,
          password_hash: 'placeholder', // In production, hash the password
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        return {
          statusCode: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Failed to create user' }),
        };
      }

      response = {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      };

    } else if (path === 'health' && method === 'GET') {
      // Health check endpoint
      response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.2'
      };

    } else if (path.startsWith('admin/')) {
      // Admin routes (no user token required - protected by admin password in frontend)
      if (path === 'admin/dashboard' && method === 'GET') {
        // Admin dashboard statistics
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch various statistics
        const [
          totalUsersResult,
          activeUsersResult,
          sessionsResult,
          newUsersTodayResult,
          activeSessionsResult,
          completedSessionsResult,
          recentSessionsResult
        ] = await Promise.all([
          // Total users
          supabase.from('users').select('id', { count: 'exact', head: true }),

          // Active users (logged in last 7 days)
          supabase.from('users')
            .select('id', { count: 'exact', head: true })
            .gte('last_login', sevenDaysAgo),

          // Total sessions
          supabase.from('step_sessions').select('id', { count: 'exact', head: true }),

          // New users today
          supabase.from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today),

          // Active sessions now
          supabase.from('step_sessions')
            .select('id', { count: 'exact', head: true })
            .is('completed_at', null),

          // Completed sessions
          supabase.from('step_sessions')
            .select('id', { count: 'exact', head: true })
            .not('completed_at', 'is', null),

          // Recent sessions for activity feed
          supabase.from('step_sessions')
            .select('*, users!inner(username)')
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        const totalUsers = totalUsersResult.count || 0;
        const activeUsers = activeUsersResult.count || 0;
        const totalSessions = sessionsResult.count || 0;
        const newUsersToday = newUsersTodayResult.count || 0;
        const activeSessionsNow = activeSessionsResult.count || 0;
        const completedSessions = completedSessionsResult.count || 0;

        const completionRate = totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0;

        // Format recent activities
        const recentActivities = (recentSessionsResult.data || []).map(session => ({
          id: session.id,
          user: session.users?.username || 'Unknown',
          action: session.completed_at ? 'Completed session' : 'Started session',
          time: session.created_at,
          duration: session.duration || 0
        }));

        response = {
          success: true,
          stats: {
            totalUsers,
            activeUsers,
            totalSessions,
            newUsersToday,
            activeSessionsNow,
            completionRate
          },
          recentActivities
        };

      } else if (path === 'admin/export-users' && method === 'GET') {
        // Export users
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching users for export:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch users' }),
          };
        }

        response = { success: true, users };
      }

    } else {
      // All other routes require authentication
      const authResult = await validateAuth(headers);
      if (!authResult.isValid) {
        return {
          statusCode: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: authResult.error }),
        };
      }

      const userId = authResult.userId;

      // Users routes
      if (path === 'users' && method === 'GET') {
        const { data: users, error } = await supabase
          .from('users')
          .select('id, username, email, created_at, is_active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching users:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch users' }),
          };
        }

        response = { success: true, users };

      } else if (path === 'users/delete' && method === 'DELETE') {
        const deleteUserId = queryParams.id;

        if (!deleteUserId) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'User ID is required' }),
          };
        }

        // Delete related data
        await supabase.from('step_sessions').delete().eq('user_id', deleteUserId);
        await supabase.from('meetings').delete().eq('organizer_id', deleteUserId);

        // Delete user
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', deleteUserId);

        if (error) {
          console.error('Error deleting user:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to delete user' }),
          };
        }

        response = { success: true, message: 'User deleted successfully' };

      } else if (path === 'sessions' && method === 'GET') {
        const { data: sessions, error } = await supabase
          .from('step_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('start_time', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching sessions:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch sessions' }),
          };
        }

        response = { success: true, sessions: sessions || [] };

      } else if (path === 'sessions' && method === 'POST') {
        const { title, duration, status } = body;

        if (!title || !duration) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Title and duration are required' }),
          };
        }

        const { data: session, error } = await supabase
          .from('step_sessions')
          .insert([{
            user_id: userId,
            title,
            duration,
            start_time: new Date().toISOString(),
            status: status || 'active',
            is_active: true,
            session_type: 'step'
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating session:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to create session' }),
          };
        }

        response = { success: true, session };

      } else if (path === 'meetings' && method === 'GET') {
        const { data: meetings, error } = await supabase
          .from('meetings')
          .select(`
            *,
            organizer:users!meetings_organizer_id_fkey(username, email)
          `)
          .order('meeting_time', { ascending: true });

        if (error) {
          console.error('Error fetching meetings:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to fetch meetings' }),
          };
        }

        response = { success: true, meetings: meetings || [] };

      } else if (path === 'meetings' && method === 'POST') {
        const { title, description, meeting_time, duration, max_participants } = body;

        if (!title || !meeting_time) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Title and meeting time are required' }),
          };
        }

        const { data: meeting, error } = await supabase
          .from('meetings')
          .insert([{
            title,
            description: description || '',
            meeting_time,
            duration: duration || 25,
            max_participants: max_participants || 10,
            organizer_id: userId,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating meeting:', error);
          return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Failed to create meeting' }),
          };
        }

        response = { success: true, meeting };

      } else {
        // Route not found
        console.error(`Route not found: ${method} ${path}`);
        console.error('Available routes: auth/login, auth/signup, health, users, sessions, meetings, admin/dashboard, admin/export-users');
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'API route not found',
            requestedPath: path,
            requestedMethod: method
          }),
        };
      }
    }

    // Return success response
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Netlify function error:', error);

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

export default handler;