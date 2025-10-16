#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user data
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `testuser_${Date.now()}@example.com`,
  password: 'Test123456!'
};

console.log('🧪 Testing Authentication Flow');
console.log('================================');
console.log('Test User:', testUser.username);
console.log('Test Email:', testUser.email);
console.log('');

async function testSignup() {
  console.log('1️⃣ Testing Signup...');

  try {
    // Step 1: Check if username is available
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', testUser.username)
      .maybeSingle();

    if (existingUser) {
      console.log('❌ Username already exists');
      return false;
    }

    console.log('✅ Username is available');

    // Step 2: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    });

    if (authError) {
      console.log('❌ Failed to create auth user:', authError.message);
      return false;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 3: Create public.users profile
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        username: testUser.username,
        display_name: testUser.username,
        email: testUser.email,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Failed to create user profile:', insertError.message);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
      return false;
    }

    console.log('✅ User profile created:', newUser.id);

    // Step 4: Sign out to test login
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    return true;

  } catch (error) {
    console.log('❌ Signup error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n2️⃣ Testing Login...');

  try {
    // Step 1: Get user by username
    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('email, id, auth_id, username')
      .eq('username', testUser.username)
      .maybeSingle();

    if (!user) {
      console.log('❌ User not found in database');
      return false;
    }

    console.log('✅ User found:', user.username);

    // Step 2: Login with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: testUser.password
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return false;
    }

    console.log('✅ Login successful!');
    console.log('   Auth ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // Step 3: Verify auth_id match
    if (user.auth_id === authData.user.id) {
      console.log('✅ Auth ID matches database');
    } else {
      console.log('⚠️ Auth ID mismatch (may need migration)');
    }

    // Step 4: Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session) {
      console.log('✅ Session active');
      console.log('   Expires:', new Date(session.expires_at * 1000).toLocaleString());
    } else {
      console.log('⚠️ No active session');
    }

    return true;

  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testCleanup() {
  console.log('\n3️⃣ Cleaning up test data...');

  try {
    // Get the user
    const { data: user } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('username', testUser.username)
      .maybeSingle();

    if (user) {
      // Delete from public.users
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (!deleteError) {
        console.log('✅ User profile deleted');
      }

      // Note: Auth user cleanup would require service role key
      console.log('ℹ️ Auth user cleanup requires service role key');
    }

  } catch (error) {
    console.log('⚠️ Cleanup error:', error.message);
  }
}

async function runTests() {
  console.log('Starting auth flow tests...\n');

  // Test signup
  const signupSuccess = await testSignup();

  if (!signupSuccess) {
    console.log('\n❌ Signup test failed!');
    return;
  }

  // Test login
  const loginSuccess = await testLogin();

  if (!loginSuccess) {
    console.log('\n❌ Login test failed!');
  } else {
    console.log('\n✅ All tests passed!');
  }

  // Cleanup
  await testCleanup();

  console.log('\n================================');
  console.log('Test complete!');
}

// Run tests
runTests().catch(console.error);