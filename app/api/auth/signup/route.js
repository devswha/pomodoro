/**
 * Signup endpoint
 * POST /api/auth/signup
 */
import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
import { corsHeaders } from '../../lib/auth';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409, headers: corsHeaders }
      );
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
