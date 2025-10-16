/**
 * Signup endpoint
 * POST /api/auth/signup
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { corsHeaders } from '../../lib/auth';

export async function POST(request) {
  try {
    const { username, email, password, displayName } = await request.json();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 로그인 ID 또는 이메일입니다.' },
        { status: 409, headers: corsHeaders }
      );
    }

    // Create user
    const userToInsert = {
      username,
      display_name: displayName || username,
      email,
      password_hash: 'placeholder', // In production, hash the password
      created_at: new Date().toISOString()
    };

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([userToInsert])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          display_name: newUser.display_name,
          email: newUser.email
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
