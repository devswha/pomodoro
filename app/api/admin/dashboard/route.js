/**
 * Admin dashboard endpoint
 * GET /api/admin/dashboard
 * No authentication required - protected by admin password in frontend
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { corsHeaders } from '../../lib/auth';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch various statistics in parallel
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

    return NextResponse.json(
      {
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
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
