/**
 * Admin export users endpoint
 * GET /api/admin/export-users
 * No authentication required - protected by admin password in frontend
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { corsHeaders } from '../../lib/auth';

export async function GET() {
  try {
    // Export users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users for export:', error);
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
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
