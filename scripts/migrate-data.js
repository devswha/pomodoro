#!/usr/bin/env node

/**
 * 📦 Data Migration Script
 * Pomodoro Timer v4.0.0
 * 
 * Migrates data from localStorage to Supabase database
 * 
 * Usage:
 *   node scripts/migrate-data.js --file exported-data.json
 *   node scripts/migrate-data.js --interactive
 *   npm run migrate:data
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  title: (msg) => console.log(`${colors.bright}${colors.magenta}📦 ${msg}${colors.reset}`)
};

class DataMigration {
  constructor() {
    this.supabase = null;
    this.migrationStats = {
      users: { attempted: 0, success: 0, failed: 0 },
      sessions: { attempted: 0, success: 0, failed: 0 },
      meetings: { attempted: 0, success: 0, failed: 0 },
      stats: { attempted: 0, success: 0, failed: 0 }
    };
    
    this.errors = [];
  }

  async run() {
    try {
      log.title('POMODORO TIMER DATA MIGRATION');
      console.log('');
      
      // Step 1: Initialize Supabase
      await this.initializeSupabase();
      
      // Step 2: Get data source
      const dataFile = this.getDataFile();
      
      // Step 3: Load and validate data
      const data = await this.loadData(dataFile);
      
      // Step 4: Create migration plan
      await this.createMigrationPlan(data);
      
      // Step 5: Execute migration
      await this.executeMigration(data);
      
      // Step 6: Validate migration
      await this.validateMigration();
      
      // Step 7: Display results
      this.displayResults();
      
    } catch (error) {
      log.error(`Migration failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }

  async initializeSupabase() {
    log.step('Initializing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase configuration. Check your .env.local file.');
    }
    
    // Use service role key for migration (bypasses RLS)
    this.supabase = createClient(supabaseUrl, serviceKey);
    
    // Test connection
    const { data, error } = await this.supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && !error.message.includes('permission denied')) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    log.success('Supabase connection established');
  }

  getDataFile() {
    // Check command line arguments
    const args = process.argv.slice(2);
    const fileIndex = args.indexOf('--file');
    
    if (fileIndex !== -1 && args[fileIndex + 1]) {
      return args[fileIndex + 1];
    }
    
    // Look for common file names
    const commonNames = [
      'pomodoro-data-export.json',
      'localStorage-export.json',
      'data-export.json',
      'migration-data.json'
    ];
    
    for (const name of commonNames) {
      if (fs.existsSync(name)) {
        log.info(`Found data file: ${name}`);
        return name;
      }
    }
    
    throw new Error('No data file specified. Use --file filename.json or place export file in project root.');
  }

  async loadData(filePath) {
    log.step(`Loading data from ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Data file not found: ${filePath}`);
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Validate data structure
      if (!data.users && !data.registeredUsers) {
        throw new Error('Invalid data format: no users found');
      }
      
      // Normalize data structure
      const normalized = {
        users: data.users || data.registeredUsers || {},
        sessions: data.sessions || {},
        stats: data.stats || {},
        meetings: data.meetings || {}
      };
      
      log.success(`Data loaded: ${Object.keys(normalized.users).length} users found`);
      return normalized;
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format in ${filePath}`);
      }
      throw error;
    }
  }

  async createMigrationPlan(data) {
    log.step('Creating migration plan...');
    
    const userCount = Object.keys(data.users).length;
    let sessionCount = 0;
    let meetingCount = 0;
    
    Object.values(data.sessions).forEach(userSessions => {
      if (Array.isArray(userSessions)) {
        sessionCount += userSessions.length;
      }
    });
    
    Object.values(data.meetings).forEach(userMeetings => {
      if (Array.isArray(userMeetings)) {
        meetingCount += userMeetings.length;
      }
    });
    
    console.log('');
    console.log('📋 Migration Plan:');
    console.log(`   • Users to migrate: ${userCount}`);
    console.log(`   • Sessions to migrate: ${sessionCount}`);
    console.log(`   • Meetings to migrate: ${meetingCount}`);
    console.log(`   • User stats to migrate: ${Object.keys(data.stats).length}`);
    console.log('');
    
    // Check for existing data
    const { data: existingUsers } = await this.supabase
      .from('users')
      .select('username');
    
    if (existingUsers && existingUsers.length > 0) {
      log.warn(`Database already contains ${existingUsers.length} users`);
      console.log('Migration will skip users that already exist.');
      console.log('');
    }
    
    return true;
  }

  async executeMigration(data) {
    log.step('Starting migration...');
    console.log('');
    
    // Migrate users first (other data depends on users)
    await this.migrateUsers(data.users);
    
    // Then migrate related data
    await this.migrateUserStats(data.stats);
    await this.migrateSessions(data.sessions);
    await this.migrateMeetings(data.meetings);
    
    log.success('Migration completed');
  }

  async migrateUsers(users) {
    log.step('Migrating users...');
    
    for (const [username, userData] of Object.entries(users)) {
      this.migrationStats.users.attempted++;
      
      try {
        // Check if user already exists
        const { data: existing } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();
        
        if (existing) {
          log.info(`User ${username} already exists, skipping`);
          continue;
        }
        
        // Generate proper password hash for migration
        const passwordHash = this.generateMigrationHash(userData.password || 'migrated_password');
        
        // Create user record
        const { data: newUser, error } = await this.supabase
          .from('users')
          .insert({
            username: username,
            display_name: userData.displayName || username,
            email: userData.email || `${username}@migrated.local`,
            password_hash: passwordHash.hash,
            password_salt: passwordHash.salt,
            password_algorithm: passwordHash.algorithm,
            bio: userData.bio || '',
            email_verified: userData.emailVerified || false,
            created_at: userData.createdAt || new Date().toISOString(),
            updated_at: userData.updatedAt || new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        log.success(`Migrated user: ${username}`);
        this.migrationStats.users.success++;
        
        // Create user preferences if they exist
        if (userData.preferences) {
          await this.createUserPreferences(newUser.id, userData.preferences);
        }
        
      } catch (error) {
        log.error(`Failed to migrate user ${username}: ${error.message}`);
        this.migrationStats.users.failed++;
        this.errors.push(`User ${username}: ${error.message}`);
      }
    }
  }

  async createUserPreferences(userId, preferences) {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          default_pomodoro_length: preferences.defaultPomodoroLength || 25,
          break_length: preferences.breakLength || 5,
          long_break_length: preferences.longBreakLength || 15,
          weekly_goal: preferences.weeklyGoal || 140,
          theme: preferences.theme || 'default',
          sound_enabled: preferences.soundEnabled !== false,
          notifications_enabled: preferences.notificationsEnabled !== false,
          auto_start_break: preferences.autoStartBreak || false,
          auto_start_pomodoro: preferences.autoStartPomodoro || false
        });
      
      if (error) throw error;
      
    } catch (error) {
      log.warn(`Failed to create preferences for user ${userId}: ${error.message}`);
    }
  }

  async migrateUserStats(statsData) {
    log.step('Migrating user statistics...');
    
    for (const [username, stats] of Object.entries(statsData)) {
      this.migrationStats.stats.attempted++;
      
      try {
        // Get user ID
        const { data: user } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();
        
        if (!user) {
          log.warn(`User ${username} not found for stats migration`);
          continue;
        }
        
        // Check if stats already exist
        const { data: existing } = await this.supabase
          .from('user_stats')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (existing) {
          // Update existing stats
          const { error } = await this.supabase
            .from('user_stats')
            .update({
              total_sessions: stats.totalSessions || 0,
              completed_sessions: stats.completedSessions || 0,
              total_minutes: stats.totalMinutes || 0,
              completed_minutes: stats.completedMinutes || 0,
              streak_days: stats.streakDays || 0,
              longest_streak: stats.longestStreak || 0,
              last_session_date: stats.lastSessionDate,
              completion_rate: stats.completionRate || 0,
              average_session_length: stats.averageSessionLength || 0,
              monthly_stats: stats.monthlyStats || {},
              daily_stats: stats.dailyStats || {},
              tags: stats.tags || {},
              locations: stats.locations || {}
            })
            .eq('user_id', user.id);
          
          if (error) throw error;
          
        } else {
          // Create new stats
          const { error } = await this.supabase
            .from('user_stats')
            .insert({
              user_id: user.id,
              total_sessions: stats.totalSessions || 0,
              completed_sessions: stats.completedSessions || 0,
              total_minutes: stats.totalMinutes || 0,
              completed_minutes: stats.completedMinutes || 0,
              streak_days: stats.streakDays || 0,
              longest_streak: stats.longestStreak || 0,
              last_session_date: stats.lastSessionDate,
              completion_rate: stats.completionRate || 0,
              average_session_length: stats.averageSessionLength || 0,
              monthly_stats: stats.monthlyStats || {},
              daily_stats: stats.dailyStats || {},
              tags: stats.tags || {},
              locations: stats.locations || {}
            });
          
          if (error) throw error;
        }
        
        this.migrationStats.stats.success++;
        
      } catch (error) {
        log.error(`Failed to migrate stats for ${username}: ${error.message}`);
        this.migrationStats.stats.failed++;
        this.errors.push(`Stats ${username}: ${error.message}`);
      }
    }
  }

  async migrateSessions(sessionsData) {
    log.step('Migrating pomodoro sessions...');
    
    for (const [username, sessions] of Object.entries(sessionsData)) {
      if (!Array.isArray(sessions)) continue;
      
      // Get user ID
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      if (!user) {
        log.warn(`User ${username} not found for sessions migration`);
        continue;
      }
      
      for (const session of sessions) {
        this.migrationStats.sessions.attempted++;
        
        try {
          const { error } = await this.supabase
            .from('pomodoro_sessions')
            .insert({
              user_id: user.id,
              title: session.title || 'Migrated Session',
              goal: session.goal || '',
              tags: session.tags || '',
              location: session.location || '',
              duration: session.duration || 25,
              start_time: session.startTime || session.createdAt,
              end_time: session.endTime || new Date(new Date(session.startTime || session.createdAt).getTime() + (session.duration || 25) * 60000).toISOString(),
              completed_at: session.completedAt,
              stopped_at: session.stoppedAt,
              status: session.status || 'completed',
              is_active: false, // All migrated sessions are not active
              session_type: 'pomodoro',
              notes: session.notes || '',
              created_at: session.createdAt || new Date().toISOString()
            });
          
          if (error) throw error;
          
          this.migrationStats.sessions.success++;
          
        } catch (error) {
          log.error(`Failed to migrate session for ${username}: ${error.message}`);
          this.migrationStats.sessions.failed++;
          this.errors.push(`Session ${username}: ${error.message}`);
        }
      }
    }
  }

  async migrateMeetings(meetingsData) {
    log.step('Migrating meetings...');
    
    for (const [username, meetings] of Object.entries(meetingsData)) {
      if (!Array.isArray(meetings)) continue;
      
      // Get user ID
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      if (!user) {
        log.warn(`User ${username} not found for meetings migration`);
        continue;
      }
      
      for (const meeting of meetings) {
        this.migrationStats.meetings.attempted++;
        
        try {
          const { error } = await this.supabase
            .from('meetings')
            .insert({
              user_id: user.id,
              title: meeting.title || 'Migrated Meeting',
              description: meeting.description || '',
              location: meeting.location || '',
              meeting_date: meeting.date,
              meeting_time: meeting.time,
              duration: meeting.duration || 60,
              status: meeting.status || 'scheduled',
              participants: meeting.participants || [],
              agenda: meeting.agenda || '',
              notes: meeting.notes || '',
              created_at: meeting.createdAt || new Date().toISOString()
            });
          
          if (error) throw error;
          
          this.migrationStats.meetings.success++;
          
        } catch (error) {
          log.error(`Failed to migrate meeting for ${username}: ${error.message}`);
          this.migrationStats.meetings.failed++;
          this.errors.push(`Meeting ${username}: ${error.message}`);
        }
      }
    }
  }

  async validateMigration() {
    log.step('Validating migration...');
    
    // Run health check
    try {
      const { data: healthCheck } = await this.supabase
        .rpc('perform_comprehensive_health_check');
      
      if (healthCheck) {
        const summary = healthCheck.find(item => item.category === 'Summary');
        if (summary) {
          log.info(`Database health after migration: ${summary.status}`);
        }
      }
      
    } catch (error) {
      log.warn(`Could not run health check: ${error.message}`);
    }
    
    // Update user statistics
    try {
      const { data: users } = await this.supabase
        .from('users')
        .select('id');
      
      if (users) {
        for (const user of users) {
          await this.supabase.rpc('update_user_statistics', { p_user_id: user.id });
        }
        log.success('Updated user statistics');
      }
      
    } catch (error) {
      log.warn(`Could not update statistics: ${error.message}`);
    }
  }

  generateMigrationHash(password) {
    // Simple hash for migration - users should change passwords
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
    
    return {
      hash: hash,
      salt: salt,
      algorithm: 'PBKDF2-SHA256-migration'
    };
  }

  displayResults() {
    console.log('');
    log.title('MIGRATION RESULTS');
    console.log('');
    
    const stats = this.migrationStats;
    
    console.log('📊 Migration Summary:');
    console.log(`   Users:     ${stats.users.success}/${stats.users.attempted} migrated`);
    console.log(`   Stats:     ${stats.stats.success}/${stats.stats.attempted} migrated`);
    console.log(`   Sessions:  ${stats.sessions.success}/${stats.sessions.attempted} migrated`);
    console.log(`   Meetings:  ${stats.meetings.success}/${stats.meetings.attempted} migrated`);
    console.log('');
    
    const totalAttempted = stats.users.attempted + stats.stats.attempted + stats.sessions.attempted + stats.meetings.attempted;
    const totalSuccess = stats.users.success + stats.stats.success + stats.sessions.success + stats.meetings.success;
    const totalFailed = stats.users.failed + stats.stats.failed + stats.sessions.failed + stats.meetings.failed;
    
    console.log(`📈 Overall Success Rate: ${Math.round((totalSuccess / totalAttempted) * 100)}%`);
    console.log('');
    
    if (totalFailed > 0) {
      console.log(`⚠️ ${totalFailed} items failed to migrate:`);
      this.errors.slice(0, 10).forEach(error => {
        console.log(`   • ${error}`);
      });
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more errors`);
      }
      console.log('');
    }
    
    if (totalSuccess > 0) {
      log.success('🎉 Migration completed successfully!');
      console.log('');
      console.log('🔐 Security Notice:');
      console.log('   • Migrated users should update their passwords');
      console.log('   • Review user email addresses (some may be placeholder)');
      console.log('   • Test user login functionality');
      console.log('');
      console.log('✅ Next Steps:');
      console.log('   1. Test user authentication');
      console.log('   2. Verify data integrity');
      console.log('   3. Run health checks periodically');
      console.log('   4. Update user passwords');
      console.log('');
    }
    
    // Save migration report
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.migrationStats,
      errors: this.errors,
      totalAttempted,
      totalSuccess,
      totalFailed,
      successRate: Math.round((totalSuccess / totalAttempted) * 100)
    };
    
    fs.writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
    log.info('Migration report saved to migration-report.json');
  }
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const migration = new DataMigration();
  migration.run().catch((error) => {
    console.error('Migration failed:', error.message);
    process.exit(1);
  });
}

export default DataMigration;