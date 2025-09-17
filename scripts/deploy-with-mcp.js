#!/usr/bin/env node

/**
 * MCP-Powered Database Deployment Script
 * 
 * This script uses the SupabaseMCPManager to deploy and configure
 * the Pomodoro Timer database with advanced monitoring and real-time features.
 */

import { config } from 'dotenv';
import { SupabaseMCPManager } from '../lib/mcp/SupabaseMCPManager.js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

class MCPDeploymentOrchestrator {
  constructor() {
    this.mcpManager = new SupabaseMCPManager();
    this.deploymentLog = [];
  }

  async run() {
    console.log('🚀 Starting MCP-Powered Database Deployment');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Initialize MCP Manager
      await this.logStep('Initializing MCP Manager', async () => {
        const result = await this.mcpManager.initialize();
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      });

      // Step 2: Deploy Database Schema
      await this.logStep('Deploying Database Schema', async () => {
        const result = await this.mcpManager.deploySchema({ 
          force: process.argv.includes('--force'),
          dryRun: process.argv.includes('--dry-run')
        });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      });

      // Step 3: Initialize Real-time Subscriptions
      await this.logStep('Setting up Real-time Subscriptions', async () => {
        const result = await this.mcpManager.initializeRealtimeSubscriptions();
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      });

      // Step 4: Perform Health Check
      await this.logStep('Running Initial Health Check', async () => {
        const result = await this.mcpManager.performHealthCheck();
        return result;
      });

      // Step 5: Create Initial Backup
      if (!process.argv.includes('--no-backup')) {
        await this.logStep('Creating Initial Backup', async () => {
          const result = await this.mcpManager.createBackup({
            includeSchema: true,
            includeData: false // No data yet for fresh deployment
          });
          return result;
        });
      }

      // Step 6: Production Optimization
      if (process.argv.includes('--production')) {
        await this.logStep('Applying Production Optimizations', async () => {
          const result = await this.mcpManager.optimizeForProduction();
          return result;
        });
      }

      // Generate deployment report
      await this.generateDeploymentReport();

      console.log('\n✅ MCP-Powered Deployment Completed Successfully!');
      console.log('🔗 Your application is ready at: http://localhost:3001');
      console.log('📊 Supabase Dashboard: https://app.supabase.com/project/pgpjkhqgpdqmnnmrzwfv');
      
      // Start monitoring mode if requested
      if (process.argv.includes('--monitor')) {
        console.log('\n📡 Starting continuous monitoring mode...');
        await this.startMonitoringMode();
      }

    } catch (error) {
      console.error('\n❌ Deployment Failed:', error.message);
      console.error('Check the deployment log for details.');
      process.exit(1);
    }
  }

  async logStep(stepName, stepFunction) {
    const startTime = Date.now();
    console.log(`\n📋 ${stepName}...`);
    
    try {
      const result = await stepFunction();
      const duration = Date.now() - startTime;
      
      this.deploymentLog.push({
        step: stepName,
        status: 'success',
        duration,
        result,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ ${stepName} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.deploymentLog.push({
        step: stepName,
        status: 'error',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ ${stepName} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  async generateDeploymentReport() {
    const report = {
      deployment: {
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        mcpEnabled: true,
        status: 'completed'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      steps: this.deploymentLog,
      healthMetrics: this.mcpManager.healthMetrics,
      realtimeSubscriptions: Array.from(this.mcpManager.realtimeSubscriptions.keys()),
      summary: {
        totalSteps: this.deploymentLog.length,
        successfulSteps: this.deploymentLog.filter(step => step.status === 'success').length,
        failedSteps: this.deploymentLog.filter(step => step.status === 'error').length,
        totalDuration: this.deploymentLog.reduce((sum, step) => sum + step.duration, 0)
      }
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'database', 'deployment-reports', `mcp-deployment-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Deployment report saved: ${reportPath}`);
    
    // Print summary
    console.log('\n📊 Deployment Summary:');
    console.log(`   • Total Steps: ${report.summary.totalSteps}`);
    console.log(`   • Successful: ${report.summary.successfulSteps}`);
    console.log(`   • Failed: ${report.summary.failedSteps}`);
    console.log(`   • Total Duration: ${report.summary.totalDuration}ms`);
    console.log(`   • Real-time Subscriptions: ${report.realtimeSubscriptions.length}`);
    
    return report;
  }

  async startMonitoringMode() {
    console.log('💚 Monitoring mode active - Press Ctrl+C to stop');
    
    // Monitor health every 30 seconds in monitoring mode
    const monitorInterval = setInterval(async () => {
      const health = await this.mcpManager.performHealthCheck();
      console.log(`💚 Health: ${health.connectionStatus} | Tables: ${Object.keys(health.tableStats || {}).length} | Real-time: ${Object.values(health.realtimeStatus || {}).filter(s => s.subscribed).length}`);
    }, 30000);

    // Monitor real-time updates
    console.log('🔄 Real-time updates will be logged below:');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down monitoring...');
      clearInterval(monitorInterval);
      await this.mcpManager.cleanup();
      console.log('✅ Monitoring stopped gracefully');
      process.exit(0);
    });

    // Keep process alive
    return new Promise(() => {});
  }
}

// CLI Help
function showHelp() {
  console.log(`
🍅 Pomodoro Timer MCP Database Deployment

Usage: node scripts/deploy-with-mcp.js [options]

Options:
  --force          Force deployment even if schema exists
  --dry-run        Validate deployment without executing
  --production     Apply production optimizations
  --no-backup      Skip initial backup creation
  --monitor        Start continuous monitoring after deployment
  --help           Show this help message

Examples:
  node scripts/deploy-with-mcp.js                    # Standard deployment
  node scripts/deploy-with-mcp.js --force            # Force redeploy
  node scripts/deploy-with-mcp.js --production       # Production deployment
  node scripts/deploy-with-mcp.js --monitor          # Deploy and monitor
  `);
}

// Main execution
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

const orchestrator = new MCPDeploymentOrchestrator();
orchestrator.run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});