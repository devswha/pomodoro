#!/usr/bin/env node

/**
 * Simple MCP Deployment Test
 * Tests the basic MCP setup without complex imports
 */

import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

async function runSimpleTests() {
  console.log('🧪 Running Simple MCP Deployment Test');
  console.log('=' .repeat(50));

  const results = [];

  // Test 1: Environment Variables
  console.log('\n📋 Test 1: Environment Configuration...');
  try {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing variables: ${missingVars.join(', ')}`);
    }

    console.log('✅ Environment variables configured correctly');
    results.push({ test: 'Environment', status: 'PASS' });

    // Log configuration (safely)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectId = url.split('.')[0].split('//')[1];
    console.log(`   Project ID: ${projectId}`);
    console.log(`   URL: ${url}`);
    console.log(`   Keys: ${requiredVars.length} configured`);

  } catch (error) {
    console.log(`❌ Environment test failed: ${error.message}`);
    results.push({ test: 'Environment', status: 'FAIL', error: error.message });
  }

  // Test 2: File Structure
  console.log('\n📋 Test 2: MCP File Structure...');
  try {
    const requiredFiles = [
      'lib/mcp/SupabaseMCPManager.js',
      'lib/contexts/MCPRealtimeContext.js',
      'scripts/deploy-with-mcp.js',
      'database/complete-setup.sql'
    ];

    const missingFiles = [];
    for (const filePath of requiredFiles) {
      try {
        await fs.access(path.join(process.cwd(), filePath));
      } catch {
        missingFiles.push(filePath);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`Missing files: ${missingFiles.join(', ')}`);
    }

    console.log('✅ All MCP files present');
    results.push({ test: 'File Structure', status: 'PASS' });
    console.log(`   Files checked: ${requiredFiles.length}`);

  } catch (error) {
    console.log(`❌ File structure test failed: ${error.message}`);
    results.push({ test: 'File Structure', status: 'FAIL', error: error.message });
  }

  // Test 3: Database Schema
  console.log('\n📋 Test 3: Database Schema File...');
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'complete-setup.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    const requiredPatterns = [
      /CREATE TABLE.*users/i,
      /CREATE TABLE.*pomodoro_sessions/i,
      /CREATE TABLE.*user_stats/i,
      /CREATE POLICY/i,
      /CREATE OR REPLACE FUNCTION/i
    ];

    const foundPatterns = requiredPatterns.filter(pattern => pattern.test(schemaSQL));
    
    if (foundPatterns.length !== requiredPatterns.length) {
      throw new Error(`Schema validation failed: ${foundPatterns.length}/${requiredPatterns.length} patterns found`);
    }

    console.log('✅ Database schema validated');
    results.push({ test: 'Schema Validation', status: 'PASS' });
    console.log(`   Schema size: ${Math.round(schemaSQL.length / 1024)}KB`);
    console.log(`   Lines: ${schemaSQL.split('\n').length}`);
    console.log(`   Patterns matched: ${foundPatterns.length}/${requiredPatterns.length}`);

  } catch (error) {
    console.log(`❌ Schema validation failed: ${error.message}`);
    results.push({ test: 'Schema Validation', status: 'FAIL', error: error.message });
  }

  // Test 4: Package Configuration
  console.log('\n📋 Test 4: Package Configuration...');
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);

    const requiredDeps = [
      '@supabase/supabase-js',
      '@supabase/realtime-js',
      'dotenv'
    ];

    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }

    const hasModuleType = packageJson.type === 'module';
    const hasMCPScripts = packageJson.scripts?.['mcp:test'] && packageJson.scripts?.['mcp:deploy'];

    if (!hasModuleType) {
      throw new Error('Package.json missing "type": "module"');
    }

    if (!hasMCPScripts) {
      throw new Error('Package.json missing MCP scripts');
    }

    console.log('✅ Package configuration correct');
    results.push({ test: 'Package Config', status: 'PASS' });
    console.log(`   Module type: ${packageJson.type}`);
    console.log(`   Dependencies: ${requiredDeps.length} required found`);
    console.log(`   MCP scripts: configured`);

  } catch (error) {
    console.log(`❌ Package configuration test failed: ${error.message}`);
    results.push({ test: 'Package Config', status: 'FAIL', error: error.message });
  }

  // Test 5: Supabase Connection Test (Basic)
  console.log('\n📋 Test 5: Basic Supabase Connection...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const testClient = createClient(supabaseUrl, supabaseKey);
    
    // Simple connection test
    const { error } = await testClient.from('information_schema.tables').select('table_name').limit(1);
    
    const connectionWorking = !error || error.message.includes('permission denied');
    
    if (!connectionWorking && !error.message.includes('permission denied')) {
      throw new Error(`Connection failed: ${error.message}`);
    }

    console.log('✅ Supabase connection working');
    results.push({ test: 'Supabase Connection', status: 'PASS' });
    console.log(`   Status: ${error ? 'Limited access (expected)' : 'Full access'}`);

  } catch (error) {
    console.log(`❌ Supabase connection test failed: ${error.message}`);
    results.push({ test: 'Supabase Connection', status: 'FAIL', error: error.message });
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${results.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Ready for MCP deployment.');
    console.log('\n💡 Next steps:');
    console.log('   1. npm run mcp:deploy    # Deploy database schema');
    console.log('   2. npm run dev           # Start development server');
    console.log('   3. npm run mcp:monitor   # Monitor in production');
  } else {
    console.log('\n⚠️  Some tests failed. Fix issues before proceeding.');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   🔧 Fix: ${result.test} - ${result.error}`);
    });
  }

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform
    },
    summary: { passed, failed, total: results.length },
    results,
    nextSteps: failed === 0 ? [
      'npm run mcp:deploy',
      'npm run dev',
      'Test application functionality'
    ] : [
      'Fix failed tests',
      'Re-run npm run mcp:test'
    ]
  };

  const reportPath = path.join(process.cwd(), 'database', 'test-reports', `simple-test-${Date.now()}.json`);
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Test report saved: ${reportPath}`);

  return passed === results.length;
}

// Run tests
runSimpleTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});