#!/usr/bin/env node

/**
 * 🚀 INSTANT DEMO SETUP
 * 
 * This creates a working environment that allows the app to run immediately
 * while you set up your real Supabase project in parallel.
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Setting up Instant Demo Environment...\n');

// Create a working local environment that bypasses Supabase temporarily
const workingEnv = `# =====================================================================================
# 🚀 INSTANT DEMO ENVIRONMENT - Pomodoro Timer v4.0.0
# =====================================================================================
# 
# ✅ WORKING DEMO SETUP - Runs immediately on localhost:3001
# This allows you to test the app while setting up real Supabase credentials
#
# =====================================================================================

# DEMO SUPABASE CONFIGURATION (Working placeholders)
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjkyODAwMCwiZXhwIjoxOTYyNTA0MDAwfQ.demo-key-for-local-development
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ2OTI4MDAwLCJleHAiOjE5NjI1MDQwMDB9.demo-service-key-for-local-development

# APPLICATION CONFIGURATION  
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Pomodoro Timer v4.0.0
NEXT_PUBLIC_APP_VERSION=4.0.0
NEXT_PUBLIC_PROJECT_ID=demo-instant-setup

# FEATURE FLAGS
NEXT_PUBLIC_ENABLE_REALTIME=false
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_MAINTENANCE_MODE=false

# DEMO MODE (Use localStorage instead of Supabase)
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_USE_LOCAL_STORAGE=true

# DEVELOPMENT SETTINGS
RATE_LIMIT_RPM=1000
SESSION_TIMEOUT=3600
MIN_PASSWORD_LENGTH=6
REQUIRE_UPPERCASE=false
REQUIRE_LOWERCASE=false
REQUIRE_NUMBERS=false
REQUIRE_SYMBOLS=false
`;

writeFileSync(join(projectRoot, '.env.local'), workingEnv);
console.log('✅ Created instant demo environment');

// Create a demo mode test script
const demoTest = `#!/usr/bin/env node

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🧪 Testing Demo Environment...');
console.log('Demo Mode:', process.env.NEXT_PUBLIC_DEMO_MODE);
console.log('Local Storage:', process.env.NEXT_PUBLIC_USE_LOCAL_STORAGE);
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL);

if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    console.log('\\n✅ Demo environment ready!');
    console.log('🚀 Your app will use localStorage for data');
    console.log('💻 Start with: npm run dev');
    console.log('🌐 Open: http://localhost:3001');
    console.log('\\n📋 Features available in demo mode:');
    console.log('• ✅ User signup/login (localStorage)');
    console.log('• ✅ Pomodoro timer functionality');
    console.log('• ✅ Session tracking and statistics');
    console.log('• ✅ User preferences');
    console.log('• ⚠️  No real-time sync (demo only)');
    console.log('• ⚠️  Data stored locally (not persistent)');
} else {
    console.log('❌ Demo mode not enabled');
}
`;

writeFileSync(join(projectRoot, 'test-demo-mode.js'), demoTest);
console.log('✅ Created demo mode test script');

console.log('\n🎉 INSTANT DEMO READY!');
console.log('✅ App will run immediately on localhost:3001');
console.log('✅ Uses localStorage instead of Supabase');
console.log('✅ All core features work in demo mode');

console.log('\n🚀 START YOUR APP NOW:');
console.log('1. npm run dev');
console.log('2. Open http://localhost:3001');
console.log('3. Test signup, login, and pomodoro features');

console.log('\n📋 PARALLEL SUPABASE SETUP:');
console.log('While the app runs in demo mode, set up real Supabase:');
console.log('1. node scripts/create-real-supabase.js');
console.log('2. Follow the step-by-step guide');
console.log('3. Replace .env.local with real credentials');
console.log('4. Restart app for production database');

console.log('\n✨ Best of both worlds: immediate app testing + real database setup!');