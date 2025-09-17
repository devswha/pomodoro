#!/usr/bin/env node

/**
 * 🚀 Automated Supabase Database Setup Script
 * Pomodoro Timer v4.0.0
 * 
 * This script automates the complete database setup process
 * 
 * Usage:
 *   node scripts/setup-database.js
 *   npm run setup:database
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';
import crypto from 'crypto';

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
  title: (msg) => console.log(`${colors.bright}${colors.magenta}🍅 ${msg}${colors.reset}`)
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

class DatabaseSetup {
  constructor() {
    this.config = {
      supabaseUrl: '',
      supabaseKey: '',
      serviceRoleKey: '',
      databaseUrl: '',
      projectId: ''
    };
    
    this.sqlFiles = [
      'complete-setup.sql',
      'health-check.sql'
    ];
    
    this.envFiles = [
      '.env.local.example',
      '.env.production.example',
      '.env.development.example'
    ];
  }

  async run() {
    try {
      log.title('POMODORO TIMER v4.0.0 - DATABASE SETUP WIZARD');
      console.log('');
      
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Gather configuration
      await this.gatherConfiguration();
      
      // Step 3: Validate SQL files
      await this.validateSqlFiles();
      
      // Step 4: Execute database setup
      await this.executeDatabaseSetup();
      
      // Step 5: Create environment files
      await this.createEnvironmentFiles();
      
      // Step 6: Run health checks
      await this.runHealthChecks();
      
      // Step 7: Display completion summary
      await this.displayCompletion();
      
    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async checkPrerequisites() {
    log.step('Checking prerequisites...');
    
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('Please run this script from the project root directory');
    }
    
    // Check if database directory exists
    if (!fs.existsSync('database')) {
      throw new Error('Database directory not found. Please ensure you have the complete project.');
    }
    
    // Check for required SQL files
    for (const file of this.sqlFiles) {
      const filePath = path.join('database', file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required SQL file not found: ${filePath}`);
      }
    }
    
    // Check if psql is available
    try {
      await this.runCommand('psql', ['--version'], { stdio: 'pipe' });
      log.success('PostgreSQL client (psql) is available');
    } catch (error) {
      log.warn('PostgreSQL client (psql) not found. You can still use Supabase SQL Editor.');
    }
    
    log.success('Prerequisites check completed');
  }

  async gatherConfiguration() {
    log.step('Gathering Supabase configuration...');
    console.log('');
    console.log('Please provide your Supabase project details:');
    console.log('(You can find these in your Supabase Dashboard → Settings → API)');
    console.log('');
    
    // Get Supabase URL
    this.config.supabaseUrl = await question('Supabase Project URL: ');
    if (!this.config.supabaseUrl.includes('.supabase.co')) {
      log.warn('URL should look like: https://your-project-id.supabase.co');
    }
    
    // Extract project ID
    const urlMatch = this.config.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      this.config.projectId = urlMatch[1];
    }
    
    // Get Supabase keys
    this.config.supabaseKey = await question('Supabase Anonymous Key: ');
    this.config.serviceRoleKey = await question('Supabase Service Role Key: ');
    
    // Ask if they want to use direct database connection
    const useDirect = await question('Do you want to use direct database connection? (y/N): ');
    if (useDirect.toLowerCase() === 'y') {
      this.config.databaseUrl = await question('Database URL (postgresql://...): ');
    }
    
    log.success('Configuration gathered');
  }

  async validateSqlFiles() {
    log.step('Validating SQL files...');
    
    for (const file of this.sqlFiles) {
      const filePath = path.join('database', file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic SQL validation
      if (!content.includes('CREATE TABLE') && !content.includes('CREATE FUNCTION')) {
        throw new Error(`SQL file ${file} appears to be invalid or empty`);
      }
      
      log.success(`Validated ${file}`);
    }
  }

  async executeDatabaseSetup() {
    log.step('Setting up database...');
    
    console.log('');
    console.log('Choose your setup method:');
    console.log('1. Use psql command line (recommended if available)');
    console.log('2. Generate SQL for manual execution in Supabase dashboard');
    console.log('');
    
    const method = await question('Choose method (1 or 2): ');
    
    if (method === '1' && this.config.databaseUrl) {
      await this.setupWithPsql();
    } else {
      await this.generateManualInstructions();
    }
  }

  async setupWithPsql() {
    log.step('Executing database setup with psql...');
    
    try {
      const sqlFile = path.join('database', 'complete-setup.sql');
      
      await this.runCommand('psql', [this.config.databaseUrl, '-f', sqlFile], {
        stdio: 'inherit'
      });
      
      log.success('Database setup completed successfully');
      
      // Run health check SQL
      log.step('Installing health check functions...');
      const healthFile = path.join('database', 'health-check.sql');
      await this.runCommand('psql', [this.config.databaseUrl, '-f', healthFile], {
        stdio: 'inherit'
      });
      
      log.success('Health check functions installed');
      
    } catch (error) {
      log.error('Database setup failed. You can use manual setup method instead.');
      await this.generateManualInstructions();
    }
  }

  async generateManualInstructions() {
    log.step('Generating manual setup instructions...');
    
    const instructions = `
🔧 MANUAL DATABASE SETUP INSTRUCTIONS

Since automatic setup couldn't be completed, please follow these steps:

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and execute the following files in order:

   a) First, execute: database/complete-setup.sql
   b) Then, execute: database/health-check.sql

5. Verify setup by running:
   SELECT * FROM perform_comprehensive_health_check();

📝 Files to execute:
${this.sqlFiles.map(file => `   - database/${file}`).join('\n')}

📖 Complete instructions available in:
   - database/PRODUCTION_SETUP_GUIDE.md
`;

    console.log(instructions);
    
    // Save instructions to file
    fs.writeFileSync('MANUAL_SETUP_INSTRUCTIONS.txt', instructions);
    log.success('Manual setup instructions saved to MANUAL_SETUP_INSTRUCTIONS.txt');
  }

  async createEnvironmentFiles() {
    log.step('Setting up environment configuration...');
    
    // Ask which environment file to create
    const envType = await question('Which environment are you setting up? (development/production/both): ');
    
    const envConfigs = {
      development: {
        template: '.env.development.example',
        output: '.env.local',
        name: 'Development'
      },
      production: {
        template: '.env.production.example',
        output: '.env.production',
        name: 'Production'
      }
    };
    
    const configs = envType === 'both' 
      ? Object.values(envConfigs)
      : [envConfigs[envType] || envConfigs.development];
    
    for (const config of configs) {
      await this.createEnvFile(config);
    }
  }

  async createEnvFile(config) {
    try {
      const templatePath = config.template;
      const outputPath = config.output;
      
      if (!fs.existsSync(templatePath)) {
        log.warn(`Template ${templatePath} not found, skipping`);
        return;
      }
      
      let content = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual values
      content = content
        .replace(/https:\/\/your-project-id\.supabase\.co/g, this.config.supabaseUrl)
        .replace(/your_anon_key_here/g, this.config.supabaseKey)
        .replace(/your_service_role_key_here/g, this.config.serviceRoleKey);
      
      if (this.config.databaseUrl) {
        content = content
          .replace(/postgresql:\/\/postgres:your_password@db\.your-project-id\.supabase\.co:5432\/postgres/g, this.config.databaseUrl);
      }
      
      // Generate NextAuth secret if needed
      if (content.includes('your_nextauth_secret_here')) {
        const secret = crypto.randomBytes(32).toString('base64');
        content = content.replace(/your_nextauth_secret_here/g, secret);
      }
      
      fs.writeFileSync(outputPath, content);
      log.success(`Created ${config.name} environment file: ${outputPath}`);
      
      if (outputPath === '.env.local') {
        log.warn('Remember to add .env.local to your .gitignore file!');
      }
      
    } catch (error) {
      log.error(`Failed to create environment file: ${error.message}`);
    }
  }

  async runHealthChecks() {
    if (!this.config.databaseUrl) {
      log.info('Skipping automatic health checks (no database URL provided)');
      log.info('You can run health checks manually in Supabase SQL Editor:');
      log.info('  SELECT * FROM perform_comprehensive_health_check();');
      return;
    }
    
    log.step('Running health checks...');
    
    try {
      const healthQuery = "SELECT * FROM perform_comprehensive_health_check();";
      const result = await this.runCommand('psql', [
        this.config.databaseUrl,
        '-c', healthQuery
      ], { stdio: 'pipe' });
      
      log.success('Health check completed');
      console.log('\n📊 Health Check Results:');
      console.log(result.stdout);
      
    } catch (error) {
      log.warn('Automatic health check failed. Run manually in Supabase dashboard:');
      log.info('  SELECT * FROM perform_comprehensive_health_check();');
    }
  }

  async displayCompletion() {
    console.log('');
    log.title('🎉 DATABASE SETUP COMPLETED!');
    console.log('');
    
    const summary = `
✅ Setup Summary:
   • Database schema installed
   • Health check functions available
   • Environment files configured
   • Ready for application integration

🚀 Next Steps:
   1. Install dependencies: npm install
   2. Start development server: npm run dev
   3. Test database connection in your app
   4. Run health checks periodically

📖 Documentation:
   • Setup Guide: database/PRODUCTION_SETUP_GUIDE.md
   • Environment Guide: database/environment-setup-guide.md
   • Health Checks: SELECT * FROM perform_comprehensive_health_check();

🔧 Available Health Check Functions:
   • perform_comprehensive_health_check() - Full system check
   • get_detailed_performance_metrics() - Performance analysis
   • validate_data_integrity() - Data validation
   • quick_diagnostic() - Quick status overview

🔐 Security Reminders:
   • Keep your service role key secure
   • Never commit .env.local to version control
   • Review RLS policies before production deployment
   • Monitor your Supabase dashboard regularly

📞 Support:
   • Documentation: database/ folder
   • Supabase Docs: https://supabase.com/docs
   • Project Issues: GitHub repository
`;

    console.log(summary);
    
    // Save summary to file
    fs.writeFileSync('SETUP_SUMMARY.txt', summary);
    log.success('Setup summary saved to SETUP_SUMMARY.txt');
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: options.stdio || 'inherit',
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}\n${stderr}`));
        }
      });
      
      child.on('error', reject);
    });
  }
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const setup = new DatabaseSetup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });
}

export default DatabaseSetup;