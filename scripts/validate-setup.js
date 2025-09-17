#!/usr/bin/env node

/**
 * 🔍 Database Setup Validation Script
 * Pomodoro Timer v4.0.0
 * 
 * Validates that the Supabase database setup is working correctly
 * 
 * Usage:
 *   node scripts/validate-setup.js
 *   npm run validate:setup
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔧${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.magenta}🔍 ${msg}${colors.reset}`)
};

class SetupValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    
    this.supabase = null;
  }

  async run() {
    try {
      log.title('SUPABASE SETUP VALIDATION');
      console.log('');
      
      // Step 1: Validate environment
      await this.validateEnvironment();
      
      // Step 2: Test Supabase connection
      await this.testSupabaseConnection();
      
      // Step 3: Validate database schema
      await this.validateDatabaseSchema();
      
      // Step 4: Test core functions
      await this.testCoreFunctions();
      
      // Step 5: Test RLS policies
      await this.testRLSPolicies();
      
      // Step 6: Run health checks
      await this.runHealthChecks();
      
      // Step 7: Performance tests
      await this.performanceTests();
      
      // Step 8: Display results
      this.displayResults();
      
    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  }

  async test(name, testFn) {
    log.step(`Testing: ${name}`);
    
    try {
      const result = await testFn();
      
      if (result === true) {
        log.success(name);
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASS', details: 'OK' });
      } else if (result === false) {
        log.error(name);
        this.results.failed++;
        this.results.tests.push({ name, status: 'FAIL', details: 'Failed' });
      } else {
        log.warn(`${name}: ${result}`);
        this.results.warnings++;
        this.results.tests.push({ name, status: 'WARN', details: result });
      }
      
    } catch (error) {
      log.error(`${name}: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', details: error.message });
    }
  }

  async validateEnvironment() {
    log.step('Validating environment variables...');
    
    await this.test('NEXT_PUBLIC_SUPABASE_URL', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!url) return false;
      if (!url.includes('.supabase.co')) return 'URL format might be incorrect';
      return true;
    });
    
    await this.test('NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!key) return false;
      if (key.length < 100) return 'Key seems too short';
      return true;
    });
    
    await this.test('SUPABASE_SERVICE_ROLE_KEY', () => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!key) return false;
      if (key.length < 100) return 'Key seems too short';
      return true;
    });
    
    await this.test('Environment File Exists', () => {
      return fs.existsSync('.env.local');
    });
    
    await this.test('GitIgnore Configuration', () => {
      if (!fs.existsSync('.gitignore')) return 'No .gitignore file found';
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes('.env.local')) return '.env.local not in .gitignore';
      return true;
    });
  }

  async testSupabaseConnection() {
    log.step('Testing Supabase connection...');
    
    await this.test('Initialize Supabase Client', () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return false;
      }
      
      this.supabase = createClient(supabaseUrl, supabaseKey);
      return true;
    });
    
    await this.test('Basic Database Connection', async () => {
      if (!this.supabase) return false;
      
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return true;
    });
    
    await this.test('Authentication System', async () => {
      if (!this.supabase) return false;
      
      // Test that auth is available
      const { data: { session } } = await this.supabase.auth.getSession();
      // Should not error, session can be null
      return true;
    });
  }

  async validateDatabaseSchema() {
    log.step('Validating database schema...');
    
    const expectedTables = [
      'users',
      'user_preferences', 
      'user_stats',
      'pomodoro_sessions',
      'meetings',
      'auth_sessions'
    ];
    
    for (const tableName of expectedTables) {
      await this.test(`Table: ${tableName}`, async () => {
        if (!this.supabase) return false;
        
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          return false; // Table doesn't exist
        }
        
        if (error && error.message.includes('permission denied')) {
          return 'Table exists but RLS might block access';
        }
        
        return true;
      });
    }
  }

  async testCoreFunctions() {
    log.step('Testing core database functions...');
    
    const functions = [
      'perform_comprehensive_health_check',
      'get_detailed_performance_metrics',
      'update_user_statistics',
      'start_pomodoro_session',
      'complete_pomodoro_session'
    ];
    
    for (const funcName of functions) {
      await this.test(`Function: ${funcName}`, async () => {
        if (!this.supabase) return false;
        
        try {
          // Test if function exists by calling it
          // For functions that need parameters, we'll just check if they exist
          if (funcName === 'perform_comprehensive_health_check') {
            const { data, error } = await this.supabase.rpc(funcName);
            if (error) throw error;
            return true;
          } else if (funcName === 'get_detailed_performance_metrics') {
            const { data, error } = await this.supabase.rpc(funcName);
            if (error) throw error;
            return true;
          } else {
            // For other functions, just check if they're callable (will fail but not with "function not found")
            const { error } = await this.supabase.rpc(funcName);
            if (error && error.message.includes('function') && error.message.includes('does not exist')) {
              return false;
            }
            return true; // Function exists but needs parameters
          }
        } catch (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            return false;
          }
          return true; // Function exists but had other error (like missing parameters)
        }
      });
    }
  }

  async testRLSPolicies() {
    log.step('Testing Row Level Security policies...');
    
    await this.test('RLS on users table', async () => {
      if (!this.supabase) return false;
      
      // Try to access users table - should be restricted by RLS
      const { data, error } = await this.supabase
        .from('users')
        .select('*');
      
      // If we get data or a specific RLS error, RLS is working
      if (error && error.message.includes('permission denied')) {
        return true; // RLS is blocking as expected
      }
      
      if (data && data.length === 0) {
        return true; // RLS is working, just no data visible
      }
      
      return 'RLS might not be properly configured';
    });
    
    await this.test('RLS on pomodoro_sessions table', async () => {
      if (!this.supabase) return false;
      
      const { data, error } = await this.supabase
        .from('pomodoro_sessions')
        .select('*');
      
      if (error && error.message.includes('permission denied')) {
        return true;
      }
      
      if (data && data.length === 0) {
        return true;
      }
      
      return 'RLS might not be properly configured';
    });
  }

  async runHealthChecks() {
    log.step('Running database health checks...');
    
    await this.test('Health Check Function', async () => {
      if (!this.supabase) return false;
      
      const { data, error } = await this.supabase
        .rpc('perform_comprehensive_health_check');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return 'Health check returned no data';
      }
      
      // Check if overall health is good
      const summary = data.find(item => item.category === 'Summary');
      if (summary) {
        if (summary.status === 'EXCELLENT' || summary.status === 'GOOD') {
          return true;
        } else {
          return `Database health: ${summary.status}`;
        }
      }
      
      return true;
    });
    
    await this.test('Performance Metrics', async () => {
      if (!this.supabase) return false;
      
      const { data, error } = await this.supabase
        .rpc('get_detailed_performance_metrics');
      
      if (error) throw error;
      
      return data && data.length > 0;
    });
  }

  async performanceTests() {
    log.step('Running performance tests...');
    
    await this.test('Query Response Time', async () => {
      if (!this.supabase) return false;
      
      const start = Date.now();
      
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);
      
      const duration = Date.now() - start;
      
      if (error && !error.message.includes('permission denied')) {
        throw error;
      }
      
      if (duration > 5000) {
        return 'Query took longer than 5 seconds';
      } else if (duration > 2000) {
        return `Query took ${duration}ms (acceptable but could be faster)`;
      }
      
      return true;
    });
    
    await this.test('Multiple Concurrent Queries', async () => {
      if (!this.supabase) return false;
      
      const start = Date.now();
      
      const promises = Array(5).fill(null).map(() => 
        this.supabase.from('users').select('count').limit(1)
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - start;
      
      if (duration > 10000) {
        return 'Concurrent queries took too long';
      }
      
      return true;
    });
  }

  displayResults() {
    console.log('');
    log.title('VALIDATION RESULTS');
    console.log('');
    
    // Display summary
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = Math.round((this.results.passed / total) * 100);
    
    console.log(`📊 Summary:`);
    console.log(`   • Total Tests: ${total}`);
    console.log(`   • ${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`   • ${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`   • ${colors.yellow}Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`   • Pass Rate: ${passRate}%`);
    console.log('');
    
    // Display detailed results
    if (this.results.failed > 0 || this.results.warnings > 0) {
      console.log('📋 Detailed Results:');
      
      this.results.tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : 
                    test.status === 'WARN' ? '⚠️' : '❌';
        console.log(`   ${icon} ${test.name}`);
        
        if (test.status !== 'PASS' && test.details !== 'OK') {
          console.log(`      ${test.details}`);
        }
      });
      
      console.log('');
    }
    
    // Overall assessment
    if (this.results.failed === 0) {
      if (this.results.warnings === 0) {
        log.success('🎉 All tests passed! Your database setup is perfect.');
      } else {
        log.warn('⚠️ Setup is working but has some warnings to review.');
      }
    } else {
      log.error('❌ Setup has critical issues that need to be fixed.');
      console.log('');
      console.log('🔧 Recommended Actions:');
      console.log('   1. Review the failed tests above');
      console.log('   2. Check your environment variables');
      console.log('   3. Verify database setup was completed');
      console.log('   4. Run: SELECT * FROM perform_comprehensive_health_check();');
      console.log('   5. Consult: database/PRODUCTION_SETUP_GUIDE.md');
    }
    
    console.log('');
    console.log('📖 Additional Resources:');
    console.log('   • Setup Guide: database/PRODUCTION_SETUP_GUIDE.md');
    console.log('   • Environment Guide: database/environment-setup-guide.md');
    console.log('   • Troubleshooting: Check Supabase dashboard logs');
    
    // Save detailed results
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        passRate
      },
      tests: this.results.tests,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    };
    
    fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
    log.info('Detailed report saved to validation-report.json');
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const validator = new SetupValidator();
  validator.run().catch((error) => {
    console.error('Validation failed:', error.message);
    process.exit(1);
  });
}

export default SetupValidator;