// Create admin user in Supabase
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Create password hash
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Check if admin user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (existingUser) {
      console.log('Admin user already exists');

      // Update password if needed
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          email: 'admin@pomodoro.com',
          display_name: 'Administrator',
          is_active: true
        })
        .eq('username', 'admin');

      if (updateError) {
        console.error('Error updating admin user:', updateError);
      } else {
        console.log('Admin user updated successfully');
      }
    } else {
      // Create new admin user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          email: 'admin@pomodoro.com',
          password_hash: passwordHash,
          display_name: 'Administrator',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating admin user:', createError);
      } else {
        console.log('Admin user created successfully:', newUser);

        // Create user stats
        await supabase.from('user_stats').insert({
          user_id: newUser.id,
          total_sessions: 0,
          completed_sessions: 0,
          total_minutes: 0,
          streak_days: 0,
          completion_rate: 0
        });

        // Create user preferences
        await supabase.from('user_preferences').insert({
          user_id: newUser.id,
          default_pomodoro_length: 25,
          break_length: 5,
          weekly_goal: 140,
          theme: 'light',
          sound_enabled: true
        });

        console.log('Admin user setup completed');
      }
    }

    // Also create test admin user
    console.log('\nCreating test admin user...');
    const testPasswordHash = await bcrypt.hash('test123', 10);

    const { data: existingTestUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'test')
      .single();

    if (existingTestUser) {
      console.log('Test user already exists');
      await supabase
        .from('users')
        .update({
          password_hash: testPasswordHash,
          email: 'test@pomodoro.com',
          display_name: 'Test Admin',
          is_active: true
        })
        .eq('username', 'test');
      console.log('Test user updated');
    } else {
      const { data: testUser, error: testError } = await supabase
        .from('users')
        .insert({
          username: 'test',
          email: 'test@pomodoro.com',
          password_hash: testPasswordHash,
          display_name: 'Test Admin',
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!testError && testUser) {
        // Create user stats for test user
        await supabase.from('user_stats').insert({
          user_id: testUser.id,
          total_sessions: 0,
          completed_sessions: 0,
          total_minutes: 0,
          streak_days: 0,
          completion_rate: 0
        });

        // Create user preferences for test user
        await supabase.from('user_preferences').insert({
          user_id: testUser.id,
          default_pomodoro_length: 25,
          break_length: 5,
          weekly_goal: 140,
          theme: 'light',
          sound_enabled: true
        });

        console.log('Test admin user created successfully');
      }
    }

    console.log('\n✅ Admin accounts ready:');
    console.log('- Username: admin, Password: admin123');
    console.log('- Username: test, Password: test123');

  } catch (error) {
    console.error('Error in admin user creation:', error);
  }
}

createAdminUser();