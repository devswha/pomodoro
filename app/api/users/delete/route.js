import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-auth',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(request) {
  try {
    // Check admin authentication header
    const adminAuth = request.headers.get('x-admin-auth');
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Delete user from database
    // Supabase will cascade delete related records (sessions, preferences, etc.)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { success: false, message: `사용자 삭제 실패: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '사용자가 성공적으로 삭제되었습니다.',
        userId
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
