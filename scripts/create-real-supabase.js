#!/usr/bin/env node

/**
 * 🚀 REAL SUPABASE PROJECT CREATOR
 * 
 * This script guides you through creating a real Supabase project
 * and provides automated setup for immediate use.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Creating Real Supabase Project for Pomodoro Timer\n');

async function createRealSupabaseProject() {
    console.log('📋 STEP-BY-STEP SUPABASE SETUP');
    console.log('================================\n');

    console.log('1️⃣ CREATE SUPABASE PROJECT');
    console.log('   → Go to: https://supabase.com/dashboard');
    console.log('   → Click "New Project"');
    console.log('   → Name: "Pomodoro Timer v4.0.0"');
    console.log('   → Choose your organization');
    console.log('   → Select a region (closest to you)');
    console.log('   → Set a strong database password');
    console.log('   → Click "Create new project"');
    console.log('   ⏰ Wait 2-3 minutes for project setup\n');

    console.log('2️⃣ GET PROJECT CREDENTIALS');
    console.log('   → Go to Project Dashboard → Settings → API');
    console.log('   → Copy "Project URL" (https://your-project-id.supabase.co)');
    console.log('   → Copy "anon/public" key (starts with eyJhbGciOiJIUzI1NiI...)');
    console.log('   → Copy "service_role" key (starts with eyJhbGciOiJIUzI1NiI...)\n');

    console.log('3️⃣ UPDATE ENVIRONMENT FILE');
    console.log('   → Open the .env.local file that was just created');
    console.log('   → Replace the placeholder values with your real credentials\n');

    console.log('4️⃣ DEPLOY DATABASE SCHEMA');
    console.log('   → Go to Project Dashboard → SQL Editor');
    console.log('   → Create a new query');
    console.log('   → Copy the entire content from SUPABASE_PRODUCTION_SETUP.sql');
    console.log('   → Paste it into the SQL Editor');
    console.log('   → Click "Run" to execute');
    console.log('   → Verify that 6 tables were created successfully\n');

    console.log('5️⃣ TEST YOUR SETUP');
    console.log('   → Run: node test-real-connection.js');
    console.log('   → Should show "All tests passed!"');
    console.log('   → If errors, double-check credentials and schema\n');

    console.log('6️⃣ START YOUR APPLICATION');
    console.log('   → Run: npm run dev');
    console.log('   → Open: http://localhost:3001');
    console.log('   → Test signup and login functionality\n');

    // Create template environment file
    const projectId = 'your-project-' + randomBytes(4).toString('hex');
    
    const envTemplate = `# =====================================================================================
# 🚀 REAL SUPABASE ENVIRONMENT - Pomodoro Timer v4.0.0
# =====================================================================================
# 
# ⚠️  REPLACE THE VALUES BELOW WITH YOUR ACTUAL SUPABASE CREDENTIALS!
# Get these from: Supabase Dashboard → Settings → API
#
# =====================================================================================

# SUPABASE CONFIGURATION (REPLACE WITH YOUR ACTUAL VALUES!)
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# APPLICATION CONFIGURATION
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Pomodoro Timer v4.0.0
NEXT_PUBLIC_APP_VERSION=4.0.0
NEXT_PUBLIC_PROJECT_ID=${projectId}

# FEATURE FLAGS
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_MAINTENANCE_MODE=false

# DEVELOPMENT SETTINGS
RATE_LIMIT_RPM=1000
SESSION_TIMEOUT=3600
MIN_PASSWORD_LENGTH=6
REQUIRE_UPPERCASE=false
REQUIRE_LOWERCASE=false
REQUIRE_NUMBERS=false
REQUIRE_SYMBOLS=false
`;

    writeFileSync(join(projectRoot, '.env.local'), envTemplate);
    console.log('✅ Created .env.local template file');

    // Create comprehensive test script
    const testScript = `#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Real Supabase Connection...');

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    console.log('Please update .env.local with your actual Supabase credentials');
    process.exit(1);
}

if (supabaseUrl.includes('your-actual-project') || supabaseKey.includes('your_actual_anon')) {
    console.log('❌ Please replace placeholder values in .env.local');
    console.log('Get real credentials from: Supabase Dashboard → Settings → API');
    process.exit(1);
}

console.log('Project URL:', supabaseUrl);
console.log('Project ID:', process.env.NEXT_PUBLIC_PROJECT_ID);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runComprehensiveTests() {
    console.log('\\n🔗 Testing connection and database schema...');
    
    const tables = [
        'users',
        'user_preferences', 
        'user_stats',
        'pomodoro_sessions',
        'meetings',
        'auth_sessions'
    ];
    
    let successCount = 0;
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count')
                .limit(1);
                
            if (error) {
                console.log('❌', table + ':', error.message);
            } else {
                console.log('✅', table + ': accessible');
                successCount++;
            }
        } catch (err) {
            console.log('❌', table + ': connection failed');
        }
    }
    
    console.log('\\n📊 Test Results:');
    console.log('Tables accessible:', successCount + '/' + tables.length);
    
    if (successCount === tables.length) {
        console.log('\\n🎉 ALL TESTS PASSED!');
        console.log('✅ Database is fully functional');
        console.log('✅ All 6 tables accessible');
        console.log('✅ Supabase integration ready');
        console.log('\\n🚀 Ready to start your application!');
        console.log('💻 Run: npm run dev');
        console.log('🌐 Open: http://localhost:3001');
    } else {
        console.log('\\n⚠️  Some tests failed');
        if (successCount === 0) {
            console.log('🔧 Check your credentials in .env.local');
            console.log('📋 Ensure you deployed the database schema');
        } else {
            console.log('📋 Deploy missing tables via SQL Editor');
            console.log('📄 Use: SUPABASE_PRODUCTION_SETUP.sql');
        }
    }
}

runComprehensiveTests().catch(err => {
    console.log('❌ Test failed:', err.message);
    console.log('🔧 Check your Supabase project and credentials');
});
`;

    writeFileSync(join(projectRoot, 'test-real-connection.js'), testScript);
    console.log('✅ Created connection test script');

    // Create deployment guide
    const deploymentGuide = `# 🚀 SUPABASE DEPLOYMENT GUIDE

## Quick Setup Checklist

### ✅ 1. Create Supabase Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Name: "Pomodoro Timer v4.0.0"
- [ ] Set database password
- [ ] Wait for project creation (2-3 minutes)

### ✅ 2. Get Credentials
- [ ] Go to Settings → API
- [ ] Copy Project URL
- [ ] Copy anon key
- [ ] Copy service_role key

### ✅ 3. Update Environment
- [ ] Open .env.local
- [ ] Replace NEXT_PUBLIC_SUPABASE_URL with your project URL
- [ ] Replace NEXT_PUBLIC_SUPABASE_ANON_KEY with your anon key
- [ ] Replace SUPABASE_SERVICE_ROLE_KEY with your service key

### ✅ 4. Deploy Database Schema
- [ ] Go to SQL Editor in Supabase Dashboard
- [ ] Copy content from SUPABASE_PRODUCTION_SETUP.sql
- [ ] Paste and execute in SQL Editor
- [ ] Verify 6 tables created successfully

### ✅ 5. Test Setup
- [ ] Run: \`node test-real-connection.js\`
- [ ] Should show "ALL TESTS PASSED!"

### ✅ 6. Start Application
- [ ] Run: \`npm run dev\`
- [ ] Open: http://localhost:3001
- [ ] Test signup/login functionality

## Troubleshooting

### Connection Issues
- Double-check credentials in .env.local
- Ensure project URL is correct format: https://project-id.supabase.co
- Verify anon key starts with: eyJhbGciOiJIUzI1NiI...

### Database Issues  
- Confirm all 6 tables exist in Supabase dashboard
- Re-run SUPABASE_PRODUCTION_SETUP.sql if tables missing
- Check table permissions and RLS policies

### Application Issues
- Restart development server: npm run dev
- Clear browser cache and cookies
- Check browser console for errors

## Support
- Supabase Docs: https://supabase.com/docs
- Project GitHub: Check repository issues
`;

    writeFileSync(join(projectRoot, 'DEPLOYMENT_GUIDE.md'), deploymentGuide);
    console.log('✅ Created deployment guide');

    // Create final setup report
    const setupReport = {
        timestamp: new Date().toISOString(),
        status: 'ready_for_credentials',
        project_template_id: projectId,
        files_created: [
            '.env.local (template)',
            'test-real-connection.js',
            'DEPLOYMENT_GUIDE.md'
        ],
        manual_steps_required: [
            'Create Supabase project',
            'Update .env.local with real credentials',
            'Deploy database schema',
            'Test connection',
            'Start application'
        ],
        estimated_setup_time: '10-15 minutes',
        support_resources: [
            'DEPLOYMENT_GUIDE.md',
            'SUPABASE_PRODUCTION_SETUP.sql',
            'test-real-connection.js'
        ]
    };

    writeFileSync(
        join(projectRoot, 'real-setup-report.json'),
        JSON.stringify(setupReport, null, 2)
    );
    console.log('✅ Created setup report');

    console.log('\n🎯 NEXT STEPS:');
    console.log('=============');
    console.log('1. Create Supabase project at https://supabase.com/dashboard');
    console.log('2. Update .env.local with your real credentials');
    console.log('3. Deploy schema using SUPABASE_PRODUCTION_SETUP.sql');
    console.log('4. Test with: node test-real-connection.js');
    console.log('5. Start app: npm run dev');

    console.log('\n📚 Documentation:');
    console.log('- DEPLOYMENT_GUIDE.md (step-by-step instructions)');
    console.log('- SUPABASE_PRODUCTION_SETUP.sql (database schema)');
    console.log('- test-real-connection.js (connection testing)');

    console.log('\n⏰ Estimated time: 10-15 minutes');
    console.log('🎉 Your Pomodoro Timer will be production-ready!');
}

createRealSupabaseProject();