#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all dependencies and environment variables are properly configured
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Validating Environment Setup...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

let validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Check if required dependencies are installed
function validateDependencies() {
  log.info('Checking dependencies...');
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom',
    'styled-components',
    'uuid',
    'dotenv'
  ];
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log.error('package.json not found');
    validationResults.failed++;
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const installedDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (installedDeps[dep]) {
      log.success(`${dep} v${installedDeps[dep]} installed`);
      validationResults.passed++;
    } else {
      log.error(`${dep} not found in package.json`);
      validationResults.failed++;
    }
  });
}

// Check environment configuration
function validateEnvironment() {
  log.info('Checking environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.warning('.env.local not found - you\'ll need to create one with Supabase credentials');
    validationResults.warnings++;
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      const line = envContent.split('\n').find(l => l.startsWith(varName));
      if (line && !line.includes('your_') && !line.includes('your-')) {
        log.success(`${varName} configured`);
        validationResults.passed++;
      } else {
        log.warning(`${varName} found but contains placeholder value`);
        validationResults.warnings++;
      }
    } else {
      log.error(`${varName} not found in .env.local`);
      validationResults.failed++;
    }
  });
}

// Check Next.js configuration
function validateNextConfig() {
  log.info('Checking Next.js configuration...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    log.error('next.config.js not found');
    validationResults.failed++;
    return;
  }
  
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check for styled-components configuration
  if (nextConfig.includes('styledComponents: true')) {
    log.success('Styled Components configured');
    validationResults.passed++;
  } else {
    log.warning('Styled Components configuration not found');
    validationResults.warnings++;
  }
  
  // Check for API routes compatibility
  if (nextConfig.includes('experimental')) {
    log.success('Experimental features configured');
    validationResults.passed++;
  } else {
    log.warning('Experimental features not configured');
    validationResults.warnings++;
  }
}

// Check project structure
function validateProjectStructure() {
  log.info('Checking project structure...');
  
  const requiredDirs = [
    'app',
    'app/api',
    'lib',
    'public'
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      log.success(`Directory ${dir} exists`);
      validationResults.passed++;
    } else {
      log.error(`Directory ${dir} not found`);
      validationResults.failed++;
    }
  });
  
  // Check for key files
  const keyFiles = [
    'app/layout.js',
    'app/page.js',
    'lib/supabase/client.js'
  ];
  
  keyFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log.success(`File ${file} exists`);
      validationResults.passed++;
    } else {
      log.error(`File ${file} not found`);
      validationResults.failed++;
    }
  });
}

// Check API routes
function validateAPIRoutes() {
  log.info('Checking API routes...');
  
  const apiRoutes = [
    'app/api/auth/login/route.js',
    'app/api/auth/session/route.js',
    'app/api/users/stats/route.js',
    'app/api/sessions/route.js'
  ];
  
  apiRoutes.forEach(route => {
    const routePath = path.join(process.cwd(), route);
    if (fs.existsSync(routePath)) {
      log.success(`API route ${route} exists`);
      validationResults.passed++;
    } else {
      log.warning(`API route ${route} not found`);
      validationResults.warnings++;
    }
  });
}

// Main validation function
async function runValidation() {
  console.log(`${colors.blue}🚀 Pomodoro Timer Environment Validation${colors.reset}\n`);
  
  validateDependencies();
  console.log();
  
  validateEnvironment();
  console.log();
  
  validateNextConfig();
  console.log();
  
  validateProjectStructure();
  console.log();
  
  validateAPIRoutes();
  console.log();
  
  // Summary
  console.log(`${colors.blue}📊 Validation Summary${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${validationResults.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${validationResults.warnings}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${validationResults.failed}${colors.reset}`);
  
  if (validationResults.failed === 0) {
    console.log(`\n${colors.green}🎉 Environment setup looks good!${colors.reset}`);
    console.log(`\nNext steps:`);
    console.log(`1. Configure your .env.local file with actual Supabase credentials`);
    console.log(`2. Start the development server: npm run dev`);
    console.log(`3. Access your application at http://localhost:3002 (or next available port)`);
  } else {
    console.log(`\n${colors.red}❌ Environment setup needs attention${colors.reset}`);
    console.log(`Please fix the failed checks above before continuing.`);
    process.exit(1);
  }
}

// Run validation
runValidation().catch(console.error);