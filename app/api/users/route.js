/**
 * Users endpoint
 * GET /api/users - Get all users (requires authentication)
 */
import { NextResponse } from 'next/server';
import { supabase } from '../lib/supabase';
import { validateAuth, corsHeaders } from '../lib/auth';

export async function GET(request) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, is_active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, users },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in users endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
