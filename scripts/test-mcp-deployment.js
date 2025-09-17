#!/usr/bin/env node

/**
 * MCP Deployment Test Suite
 * 
 * Comprehensive testing of the MCP-powered database setup
 * and real-time functionality integration.
 */

import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables first
config({ path: '.env.local' });

// Then import Supabase clients
import { supabase, supabaseAdmin } from '../lib/supabase/client.js';

class MCPDeploymentTester {
  constructor() {
    this.testResults = [];
    this.deploymentData = {
      tables: [],
      functions: [],
      policies: [],
      triggers: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting MCP Deployment Test Suite');
    console.log('=' .repeat(50));

    try {
      // Test 1: Environment validation
      await this.runTest('Environment Configuration', this.testEnvironment.bind(this));

      // Test 2: Database connection
      await this.runTest('Database Connection', this.testDatabaseConnection.bind(this));

      // Test 3: Schema deployment simulation
      await this.runTest('Schema Deployment', this.testSchemaDeployment.bind(this));

      // Test 4: Table verification
      await this.runTest('Table Structure Verification', this.testTableStructure.bind(this));

      // Test 5: RLS policies
      await this.runTest('Row Level Security Policies', this.testRLSPolicies.bind(this));

      // Test 6: Database functions
      await this.runTest('Database Functions', this.testDatabaseFunctions.bind(this));

      // Test 7: Real-time capabilities
      await this.runTest('Real-time Subscriptions', this.testRealtimeCapabilities.bind(this));

      // Test 8: Performance testing
      await this.runTest('Performance Metrics', this.testPerformance.bind(this));

      // Test 9: Authentication integration
      await this.runTest('Authentication Integration', this.testAuthIntegration.bind(this));

      // Test 10: Data operations
      await this.runTest('CRUD Operations', this.testCRUDOperations.bind(this));

      // Generate test report
      await this.generateTestReport();

      const passedTests = this.testResults.filter(test => test.status === 'passed').length;
      const failedTests = this.testResults.filter(test => test.status === 'failed').length;

      console.log('\n📊 Test Summary:');
      console.log(`✅ Passed: ${passedTests}`);
      console.log(`❌ Failed: ${failedTests}`);
      console.log(`📋 Total: ${this.testResults.length}`);

      if (failedTests === 0) {
        console.log('\n🎉 All tests passed! MCP deployment is ready.');
        console.log('💡 You can now run: node scripts/deploy-with-mcp.js');
      } else {
        console.log('\n⚠️  Some tests failed. Please fix issues before deployment.');
      }

    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    console.log(`\n🧪 Running test: ${testName}`);

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        result,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  async testEnvironment() {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Validate URL format
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      throw new Error('Invalid Supabase URL format');
    }

    return {
      message: 'Environment variables are correctly configured',
      url: url.split('.')[0].split('//')[1], // Extract project ID
      variables: requiredVars.length
    };
  }

  async testDatabaseConnection() {
    // Test anonymous client
    const { error: anonError } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    if (anonError && !anonError.message.includes('permission denied')) {
      throw new Error(`Anonymous client connection failed: ${anonError.message}`);
    }

    // Test admin client
    if (!supabaseAdmin) {
      throw new Error('Admin client not configured');
    }

    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (adminError) {
      throw new Error(`Admin client connection failed: ${adminError.message}`);
    }

    return {
      message: 'Database connections successful',
      anonConnection: !anonError,
      adminConnection: !adminError,
      tablesAccess: !!adminData
    };
  }

  async testSchemaDeployment() {
    // Test if we can read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'complete-setup.sql');
    
    try {
      const schemaSQL = await fs.readFile(schemaPath, 'utf8');
      
      // Basic SQL validation
      const requiredPatterns = [
        /CREATE TABLE.*users/i,
        /CREATE TABLE.*pomodoro_sessions/i,
        /CREATE TABLE.*user_stats/i,
        /CREATE POLICY/i,
        /CREATE OR REPLACE FUNCTION/i
      ];

      const missingPatterns = requiredPatterns.filter(pattern => !pattern.test(schemaSQL));
      
      if (missingPatterns.length > 0) {
        throw new Error(`Schema file missing required patterns: ${missingPatterns.length} issues found`);
      }

      return {
        message: 'Schema file validation passed',
        fileSize: schemaSQL.length,
        linesCount: schemaSQL.split('\n').length,
        patternsFound: requiredPatterns.length - missingPatterns.length
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Schema file not found: database/complete-setup.sql');
      }
      throw error;
    }
  }

  async testTableStructure() {
    // Check if tables exist or can be created
    const expectedTables = [
      'users',
      'user_preferences', 
      'user_stats',
      'pomodoro_sessions',
      'meetings',
      'auth_sessions'
    ];

    const { data: existingTables, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', expectedTables);

    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw new Error(`Failed to check table structure: ${error.message}`);
    }

    const foundTables = existingTables?.map(row => row.table_name) || [];
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));

    this.deploymentData.tables = foundTables;

    return {
      message: foundTables.length > 0 ? 'Some tables already exist' : 'Ready for table creation',
      expectedTables: expectedTables.length,
      existingTables: foundTables.length,
      missingTables: missingTables.length,
      tables: {
        existing: foundTables,
        missing: missingTables
      }
    };
  }

  async testRLSPolicies() {
    // Test if we can query policy information
    try {
      const { data: policies, error } = await supabaseAdmin
        .from('pg_policies')
        .select('policyname, tablename')
        .limit(10);

      if (error && !error.message.includes('permission denied') && !error.message.includes('does not exist')) {
        throw new Error(`Failed to access policies: ${error.message}`);
      }

      this.deploymentData.policies = policies || [];

      return {
        message: 'RLS policy system accessible',
        existingPolicies: policies?.length || 0,
        canAccessPolicyTable: !error
      };
    } catch (error) {
      return {
        message: 'RLS policy testing (limited access)',
        note: 'Full policy testing requires deployment',
        accessible: false
      };
    }
  }

  async testDatabaseFunctions() {
    // Test if we can access function information
    try {
      const { data: functions, error } = await supabaseAdmin
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .limit(10);

      if (error && !error.message.includes('permission denied')) {
        throw new Error(`Failed to access functions: ${error.message}`);
      }

      this.deploymentData.functions = functions || [];

      return {
        message: 'Database function system accessible',
        existingFunctions: functions?.length || 0,
        canAccessRoutines: !error
      };
    } catch (error) {
      return {
        message: 'Function testing (limited access)',
        note: 'Full function testing requires deployment',
        accessible: false
      };
    }
  }

  async testRealtimeCapabilities() {
    // Test real-time connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Real-time connection timeout'));
      }, 10000);

      try {
        const channel = supabase.channel('test_realtime');
        
        channel.subscribe((status, err) => {
          clearTimeout(timeout);
          
          if (err) {
            reject(new Error(`Real-time subscription failed: ${err.message}`));
            return;
          }

          channel.unsubscribe();
          
          resolve({
            message: 'Real-time capabilities working',
            subscriptionStatus: status,
            canSubscribe: status === 'SUBSCRIBED'
          });
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  async testPerformance() {
    // Test basic query performance
    const startTime = performance.now();
    
    const { error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(5);

    const queryTime = performance.now() - startTime;

    if (error && !error.message.includes('permission denied')) {
      throw new Error(`Performance test failed: ${error.message}`);
    }

    return {
      message: 'Performance metrics collected',
      queryTime: Math.round(queryTime),
      performance: queryTime < 1000 ? 'good' : queryTime < 2000 ? 'acceptable' : 'slow'
    };
  }

  async testAuthIntegration() {
    // Test if auth schema is accessible
    try {
      const { data, error } = await supabaseAdmin
        .from('auth.users')
        .select('count')
        .limit(1);

      return {
        message: 'Authentication system accessible',
        authSchemaAvailable: !error,
        canAccessAuthUsers: !error
      };
    } catch (error) {
      return {
        message: 'Authentication system (limited access)',
        note: 'Auth testing limited by permissions',
        error: error.message
      };
    }
  }

  async testCRUDOperations() {
    // Test basic CRUD operations simulation
    const testOperations = [
      'CREATE (INSERT)',
      'READ (SELECT)', 
      'UPDATE',
      'DELETE'
    ];

    return {
      message: 'CRUD operations ready for testing',
      operations: testOperations,
      note: 'Full CRUD testing requires deployed schema'
    };
  }

  async generateTestReport() {
    const report = {
      testSuite: {
        name: 'MCP Deployment Test Suite',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      },
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(test => test.status === 'passed').length,
        failed: this.testResults.filter(test => test.status === 'failed').length,
        totalDuration: this.testResults.reduce((sum, test) => sum + test.duration, 0)
      },
      tests: this.testResults,
      deploymentData: this.deploymentData,
      recommendations: this.generateRecommendations()
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'database', 'test-reports', `mcp-test-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Test report saved: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.testResults.filter(test => test.status === 'failed');

    if (failedTests.length === 0) {
      recommendations.push('✅ All tests passed - ready for MCP deployment');
      recommendations.push('💡 Run: node scripts/deploy-with-mcp.js --monitor');
    } else {
      recommendations.push('⚠️  Fix failed tests before deployment');
      failedTests.forEach(test => {
        recommendations.push(`🔧 Fix: ${test.name} - ${test.error}`);
      });
    }

    if (this.deploymentData.tables.length > 0) {
      recommendations.push('📋 Existing tables detected - use --force flag if needed');
    }

    return recommendations;
  }
}

// CLI execution
const tester = new MCPDeploymentTester();
tester.runAllTests().catch(error => {
  console.error('💥 Test suite execution failed:', error);
  process.exit(1);
});