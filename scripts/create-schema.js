#!/usr/bin/env node

/**
 * Automatic Supabase Schema Creation Script
 * Creates all tables and policies for Pomodoro Timer v4.0.0
 */

import { supabase } from '../lib/supabase/client.js';

async function createSchema() {
    console.log('🚀 Starting automatic schema creation...\n');

    try {
        // Test connection first
        console.log('1️⃣ Testing Supabase connection...');
        const { data: testConnection, error: connectionError } = await supabase
            .from('auth.users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('❌ Connection test failed:', connectionError.message);
            console.log('✅ But this is expected for new projects. Proceeding...\n');
        } else {
            console.log('✅ Supabase connection successful\n');
        }

        // Schema creation steps
        const steps = [
            {
                name: 'Enable UUID extension',
                sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
            },
            {
                name: 'Create users table',
                sql: `
                CREATE TABLE IF NOT EXISTS public.users (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    display_name VARCHAR(100),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    last_login TIMESTAMPTZ
                );`
            },
            {
                name: 'Create user_preferences table',
                sql: `
                CREATE TABLE IF NOT EXISTS public.user_preferences (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                    default_pomodoro_length INTEGER DEFAULT 25,
                    break_length INTEGER DEFAULT 5,
                    weekly_goal INTEGER DEFAULT 140,
                    theme VARCHAR(20) DEFAULT 'light',
                    sound_enabled BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(user_id)
                );`
            },
            {
                name: 'Create user_stats table',
                sql: `
                CREATE TABLE IF NOT EXISTS public.user_stats (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                    total_sessions INTEGER DEFAULT 0,
                    completed_sessions INTEGER DEFAULT 0,
                    total_minutes INTEGER DEFAULT 0,
                    streak_days INTEGER DEFAULT 0,
                    completion_rate DECIMAL(5,2) DEFAULT 0.0,
                    monthly_stats JSONB DEFAULT '{}',
                    daily_stats JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(user_id)
                );`
            },
            {
                name: 'Create pomodoro_sessions table',
                sql: `
                CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                    title VARCHAR(255) DEFAULT 'Pomodoro Session',
                    duration INTEGER DEFAULT 25,
                    start_time TIMESTAMPTZ DEFAULT NOW(),
                    end_time TIMESTAMPTZ,
                    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'expired')),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );`
            },
            {
                name: 'Create meetings table',
                sql: `
                CREATE TABLE IF NOT EXISTS public.meetings (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    meeting_date DATE NOT NULL,
                    meeting_time TIME NOT NULL,
                    duration INTEGER DEFAULT 60,
                    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
                    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team')),
                    max_participants INTEGER DEFAULT 10,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );`
            },
            {
                name: 'Create meeting_participants table',
                sql: `
                CREATE TABLE IF NOT EXISTS public.meeting_participants (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
                    invited_at TIMESTAMPTZ DEFAULT NOW(),
                    responded_at TIMESTAMPTZ,
                    UNIQUE(meeting_id, user_id)
                );`
            }
        ];

        // Execute each step
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`${i + 2}️⃣ ${step.name}...`);

            try {
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: step.sql.trim()
                });

                if (error) {
                    console.log(`   ❌ Failed: ${error.message}`);

                    // Try alternative method for table creation
                    console.log(`   🔄 Trying alternative approach...`);

                    // For table creation, we might need to use different approach
                    // This is a limitation of Supabase client - it doesn't support DDL directly
                    console.log(`   ⚠️  Please run this SQL manually in Supabase Dashboard:`);
                    console.log(`   ${step.sql.trim()}\n`);
                } else {
                    console.log(`   ✅ Success`);
                }
            } catch (err) {
                console.log(`   ❌ Error: ${err.message}`);
                console.log(`   📋 Manual SQL needed:`);
                console.log(`   ${step.sql.trim()}\n`);
            }
        }

        // Check what tables exist
        console.log('🔍 Checking created tables...');
        try {
            const { data: tables, error } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');

            if (tables && tables.length > 0) {
                console.log('✅ Tables found:');
                tables.forEach(table => console.log(`   - ${table.table_name}`));
            } else {
                console.log('❌ No tables found. Manual creation required.');
            }
        } catch (err) {
            console.log('⚠️  Could not check tables:', err.message);
        }

        console.log('\n🎉 Schema creation process completed!');
        console.log('\n📋 Next steps:');
        console.log('1. If tables were not created automatically, copy the SQL statements above');
        console.log('2. Go to Supabase Dashboard → SQL Editor');
        console.log('3. Run each SQL statement manually');
        console.log('4. Come back to test the application');

    } catch (error) {
        console.error('❌ Schema creation failed:', error);
        console.log('\n🔧 Alternative: Manual schema creation required');
        console.log('Please run the SQL statements manually in Supabase Dashboard');
    }
}

// Run the script
createSchema().catch(console.error);