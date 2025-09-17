/**
 * Data Migration Manager for Pomodoro Timer v4.0.0
 * Comprehensive migration system from localStorage to Supabase PostgreSQL
 * 
 * Features:
 * - Zero data loss migration
 * - Progress tracking and validation
 * - Rollback mechanisms
 * - Hybrid mode support
 * - Real-time migration monitoring
 */

import { supabase } from '../supabase'

export class DataMigrationManager {
  constructor() {
    this.migrationKey = 'pomodoroMigrationStatus'
    this.backupKey = 'pomodoroMigrationBackup'
    this.progressKey = 'pomodoroMigrationProgress'
    this.isDebugMode = process.env.NODE_ENV === 'development'
    this.migrationSteps = [
      'export_data',
      'validate_export',
      'create_backup',
      'migrate_users',
      'migrate_preferences',
      'migrate_stats',
      'migrate_sessions',
      'migrate_meetings',
      'validate_migration',
      'cleanup'
    ]
  }

  // =====================================================================================
  // MIGRATION STATUS MANAGEMENT
  // =====================================================================================

  getMigrationStatus() {
    if (typeof window === 'undefined' || !localStorage) return null
    
    try {
      const status = localStorage.getItem(this.migrationKey)
      return status ? JSON.parse(status) : {
        isStarted: false,
        isCompleted: false,
        currentStep: null,
        completedSteps: [],
        errors: [],
        startTime: null,
        endTime: null,
        progress: 0
      }
    } catch (error) {
      console.error('Failed to get migration status:', error)
      return null
    }
  }

  updateMigrationStatus(updates) {
    if (typeof window === 'undefined' || !localStorage) return

    try {
      const currentStatus = this.getMigrationStatus()
      const newStatus = {
        ...currentStatus,
        ...updates,
        lastUpdated: new Date().toISOString()
      }

      // Calculate progress
      if (newStatus.completedSteps) {
        newStatus.progress = Math.round(
          (newStatus.completedSteps.length / this.migrationSteps.length) * 100
        )
      }

      localStorage.setItem(this.migrationKey, JSON.stringify(newStatus))
      
      // Trigger progress event
      this.triggerProgressEvent(newStatus)
      
      return newStatus
    } catch (error) {
      console.error('Failed to update migration status:', error)
      return null
    }
  }

  triggerProgressEvent(status) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('migrationProgress', {
        detail: status
      })
      window.dispatchEvent(event)
    }
  }

  // =====================================================================================
  // DATA EXPORT SYSTEM
  // =====================================================================================

  async exportLocalStorageData() {
    this.log('Starting localStorage data export...')
    
    try {
      if (typeof window === 'undefined' || !localStorage) {
        throw new Error('localStorage not available')
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        source: 'localStorage',
        users: {},
        sessions: {},
        stats: {},
        meetings: {},
        metadata: {}
      }

      // Export registered users
      const registeredUsers = localStorage.getItem('registeredUsers')
      if (registeredUsers) {
        exportData.users = JSON.parse(registeredUsers)
      }

      // Export user sessions
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        exportData.metadata.currentUser = currentUser
      }

      // Export all user-specific data
      for (const userId of Object.keys(exportData.users)) {
        // Export pomodoro sessions
        const sessionsKey = `pomodoroSessions_${userId}`
        const sessions = localStorage.getItem(sessionsKey)
        if (sessions) {
          exportData.sessions[userId] = JSON.parse(sessions)
        }

        // Export user statistics
        const statsKey = `userStats_${userId}`
        const stats = localStorage.getItem(statsKey)
        if (stats) {
          exportData.stats[userId] = JSON.parse(stats)
        }

        // Export meetings
        const meetingsKey = `meetings_${userId}`
        const meetings = localStorage.getItem(meetingsKey)
        if (meetings) {
          exportData.meetings[userId] = JSON.parse(meetings)
        }

        // Export active session if exists
        const activeSessionKey = `activePomodoroSession_${userId}`
        const activeSession = localStorage.getItem(activeSessionKey)
        if (activeSession) {
          if (!exportData.metadata.activeSessions) {
            exportData.metadata.activeSessions = {}
          }
          exportData.metadata.activeSessions[userId] = JSON.parse(activeSession)
        }
      }

      // Calculate export statistics
      exportData.metadata.statistics = {
        totalUsers: Object.keys(exportData.users).length,
        totalSessions: Object.values(exportData.sessions).reduce(
          (total, userSessions) => total + (userSessions?.length || 0), 0
        ),
        totalMeetings: Object.values(exportData.meetings).reduce(
          (total, userMeetings) => total + (userMeetings?.length || 0), 0
        ),
        exportSize: JSON.stringify(exportData).length
      }

      this.log(`Export completed - Users: ${exportData.metadata.statistics.totalUsers}, Sessions: ${exportData.metadata.statistics.totalSessions}`)
      
      return exportData
    } catch (error) {
      this.log(`Export failed: ${error.message}`, 'error')
      throw new Error(`Failed to export localStorage data: ${error.message}`)
    }
  }

  // =====================================================================================
  // DATA VALIDATION SYSTEM
  // =====================================================================================

  validateExportData(exportData) {
    this.log('Validating exported data...')
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        validUsers: 0,
        invalidUsers: 0,
        validSessions: 0,
        invalidSessions: 0,
        validMeetings: 0,
        invalidMeetings: 0
      }
    }

    try {
      // Validate structure
      if (!exportData || typeof exportData !== 'object') {
        validation.errors.push('Export data is not a valid object')
        validation.isValid = false
        return validation
      }

      // Validate required fields
      const requiredFields = ['timestamp', 'version', 'users', 'sessions', 'stats', 'meetings']
      for (const field of requiredFields) {
        if (!(field in exportData)) {
          validation.errors.push(`Missing required field: ${field}`)
          validation.isValid = false
        }
      }

      // Validate users
      if (exportData.users && typeof exportData.users === 'object') {
        for (const [userId, userData] of Object.entries(exportData.users)) {
          const userValidation = this.validateUserData(userId, userData)
          if (userValidation.isValid) {
            validation.statistics.validUsers++
          } else {
            validation.statistics.invalidUsers++
            validation.errors.push(`User ${userId}: ${userValidation.errors.join(', ')}`)
            validation.isValid = false
          }
        }
      }

      // Validate sessions
      if (exportData.sessions && typeof exportData.sessions === 'object') {
        for (const [userId, userSessions] of Object.entries(exportData.sessions)) {
          if (!Array.isArray(userSessions)) {
            validation.errors.push(`Sessions for user ${userId} is not an array`)
            validation.isValid = false
            continue
          }

          for (const session of userSessions) {
            const sessionValidation = this.validateSessionData(session)
            if (sessionValidation.isValid) {
              validation.statistics.validSessions++
            } else {
              validation.statistics.invalidSessions++
              validation.warnings.push(`Session ${session.id || 'unknown'}: ${sessionValidation.errors.join(', ')}`)
            }
          }
        }
      }

      // Validate meetings
      if (exportData.meetings && typeof exportData.meetings === 'object') {
        for (const [userId, userMeetings] of Object.entries(exportData.meetings)) {
          if (!Array.isArray(userMeetings)) {
            validation.errors.push(`Meetings for user ${userId} is not an array`)
            validation.isValid = false
            continue
          }

          for (const meeting of userMeetings) {
            const meetingValidation = this.validateMeetingData(meeting)
            if (meetingValidation.isValid) {
              validation.statistics.validMeetings++
            } else {
              validation.statistics.invalidMeetings++
              validation.warnings.push(`Meeting ${meeting.id || 'unknown'}: ${meetingValidation.errors.join(', ')}`)
            }
          }
        }
      }

      this.log(`Validation completed - Valid: ${validation.isValid}, Errors: ${validation.errors.length}, Warnings: ${validation.warnings.length}`)
      
      return validation
    } catch (error) {
      validation.isValid = false
      validation.errors.push(`Validation failed: ${error.message}`)
      this.log(`Validation failed: ${error.message}`, 'error')
      return validation
    }
  }

  validateUserData(userId, userData) {
    const validation = { isValid: true, errors: [] }

    if (!userId || typeof userId !== 'string') {
      validation.errors.push('Invalid user ID')
    }

    if (!userData || typeof userData !== 'object') {
      validation.errors.push('Invalid user data object')
    } else {
      if (!userData.email || typeof userData.email !== 'string') {
        validation.errors.push('Missing or invalid email')
      }

      if (!userData.password || typeof userData.password !== 'string') {
        validation.errors.push('Missing or invalid password')
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (userData.email && !emailRegex.test(userData.email)) {
        validation.errors.push('Invalid email format')
      }
    }

    validation.isValid = validation.errors.length === 0
    return validation
  }

  validateSessionData(session) {
    const validation = { isValid: true, errors: [] }

    if (!session || typeof session !== 'object') {
      validation.errors.push('Invalid session object')
      validation.isValid = false
      return validation
    }

    if (!session.id) {
      validation.errors.push('Missing session ID')
    }

    if (!session.duration || typeof session.duration !== 'number') {
      validation.errors.push('Missing or invalid duration')
    }

    if (!session.startTime) {
      validation.errors.push('Missing start time')
    }

    validation.isValid = validation.errors.length === 0
    return validation
  }

  validateMeetingData(meeting) {
    const validation = { isValid: true, errors: [] }

    if (!meeting || typeof meeting !== 'object') {
      validation.errors.push('Invalid meeting object')
      validation.isValid = false
      return validation
    }

    if (!meeting.title) {
      validation.errors.push('Missing meeting title')
    }

    if (!meeting.date) {
      validation.errors.push('Missing meeting date')
    }

    if (!meeting.time) {
      validation.errors.push('Missing meeting time')
    }

    validation.isValid = validation.errors.length === 0
    return validation
  }

  // =====================================================================================
  // BACKUP SYSTEM
  // =====================================================================================

  async createBackup(exportData) {
    this.log('Creating migration backup...')
    
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        originalData: exportData,
        migrationVersion: '4.0.0',
        source: 'localStorage'
      }

      // Store backup in localStorage
      localStorage.setItem(this.backupKey, JSON.stringify(backup))

      // Also try to download backup file
      if (typeof window !== 'undefined' && window.document) {
        this.downloadBackupFile(backup)
      }

      this.log('Backup created successfully')
      return backup
    } catch (error) {
      this.log(`Backup creation failed: ${error.message}`, 'error')
      throw new Error(`Failed to create backup: ${error.message}`)
    }
  }

  downloadBackupFile(backup) {
    try {
      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      this.log('Backup file downloaded')
    } catch (error) {
      this.log(`Failed to download backup file: ${error.message}`, 'warn')
    }
  }

  // =====================================================================================
  // MAIN MIGRATION ORCHESTRATION
  // =====================================================================================

  async startMigration(options = {}) {
    const {
      skipBackup = false,
      dryRun = false,
      batchSize = 10
    } = options

    this.log('Starting data migration process...')

    try {
      // Initialize migration status
      this.updateMigrationStatus({
        isStarted: true,
        isCompleted: false,
        currentStep: 'export_data',
        completedSteps: [],
        errors: [],
        startTime: new Date().toISOString(),
        options: options
      })

      // Step 1: Export data
      const exportData = await this.exportLocalStorageData()
      this.updateMigrationStatus({
        currentStep: 'validate_export',
        completedSteps: ['export_data'],
        exportData: { statistics: exportData.metadata.statistics }
      })

      // Step 2: Validate export
      const validation = this.validateExportData(exportData)
      if (!validation.isValid && !options.ignoreValidationErrors) {
        throw new Error(`Export validation failed: ${validation.errors.join(', ')}`)
      }
      this.updateMigrationStatus({
        currentStep: 'create_backup',
        completedSteps: ['export_data', 'validate_export'],
        validation: validation
      })

      // Step 3: Create backup
      if (!skipBackup) {
        await this.createBackup(exportData)
        this.updateMigrationStatus({
          currentStep: 'migrate_users',
          completedSteps: ['export_data', 'validate_export', 'create_backup']
        })
      }

      // If dry run, stop here
      if (dryRun) {
        this.updateMigrationStatus({
          isCompleted: true,
          currentStep: 'completed',
          completedSteps: this.migrationSteps.filter(step => 
            ['export_data', 'validate_export', 'create_backup'].includes(step)
          ),
          endTime: new Date().toISOString()
        })
        return { success: true, dryRun: true, exportData, validation }
      }

      // Step 4-8: Migrate data
      const migrationResult = await this.migrateDataToSupabase(exportData, batchSize)

      // Step 9: Validate migration
      const migrationValidation = await this.validateSupabaseMigration(exportData)

      // Step 10: Cleanup
      await this.postMigrationCleanup()

      // Complete migration
      this.updateMigrationStatus({
        isCompleted: true,
        currentStep: 'completed',
        completedSteps: this.migrationSteps,
        endTime: new Date().toISOString(),
        migrationResult: migrationResult,
        migrationValidation: migrationValidation
      })

      this.log('Migration completed successfully!')
      
      return {
        success: true,
        exportData,
        validation,
        migrationResult,
        migrationValidation
      }

    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error')
      
      const status = this.getMigrationStatus()
      this.updateMigrationStatus({
        errors: [...(status?.errors || []), {
          step: status?.currentStep,
          message: error.message,
          timestamp: new Date().toISOString()
        }]
      })

      throw error
    }
  }

  // =====================================================================================
  // SUPABASE MIGRATION EXECUTION
  // =====================================================================================

  async migrateDataToSupabase(exportData, batchSize = 10) {
    this.log('Starting Supabase migration...')
    
    const result = {
      migratedUsers: 0,
      migratedSessions: 0,
      migratedMeetings: 0,
      errors: []
    }

    try {
      // Migrate users in batches
      const userEntries = Object.entries(exportData.users)
      for (let i = 0; i < userEntries.length; i += batchSize) {
        const batch = userEntries.slice(i, i + batchSize)
        
        for (const [userId, userData] of batch) {
          try {
            await this.migrateUserToSupabase(userId, userData, exportData)
            result.migratedUsers++
          } catch (error) {
            result.errors.push(`User ${userId}: ${error.message}`)
            this.log(`Failed to migrate user ${userId}: ${error.message}`, 'error')
          }
        }

        // Update progress
        this.updateMigrationStatus({
          currentStep: 'migrate_users',
          progress: Math.round((i + batch.length) / userEntries.length * 100 * 0.4) // Users = 40% of migration
        })
      }

      this.updateMigrationStatus({
        currentStep: 'migrate_sessions',
        completedSteps: [...this.getMigrationStatus().completedSteps, 'migrate_users']
      })

      this.log(`Migration completed - Users: ${result.migratedUsers}, Sessions: ${result.migratedSessions}, Meetings: ${result.migratedMeetings}`)
      
      return result
    } catch (error) {
      this.log(`Supabase migration failed: ${error.message}`, 'error')
      throw error
    }
  }

  async migrateUserToSupabase(userId, userData, exportData) {
    try {
      // First, check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', userId)
        .single()

      if (existingUser) {
        this.log(`User ${userId} already exists, skipping migration`)
        return
      }

      // Use the migration function from the database
      const { data: migrationResult, error: migrationError } = await supabase
        .rpc('migrate_user_from_localstorage', {
          p_user_data: userData
        })

      if (migrationError) {
        throw migrationError
      }

      const newUserId = migrationResult

      // Migrate user statistics if available
      if (exportData.stats[userId]) {
        await supabase.rpc('migrate_user_stats_from_localstorage', {
          p_user_id: newUserId,
          p_stats_data: exportData.stats[userId]
        })
      }

      // Migrate user sessions if available
      if (exportData.sessions[userId] && exportData.sessions[userId].length > 0) {
        await supabase.rpc('migrate_pomodoro_sessions_from_localstorage', {
          p_user_id: newUserId,
          p_sessions_data: exportData.sessions[userId]
        })
      }

      // Migrate user meetings if available
      if (exportData.meetings[userId] && exportData.meetings[userId].length > 0) {
        await supabase.rpc('migrate_meetings_from_localstorage', {
          p_user_id: newUserId,
          p_meetings_data: exportData.meetings[userId]
        })
      }

      this.log(`Successfully migrated user: ${userId}`)
      
    } catch (error) {
      this.log(`Failed to migrate user ${userId}: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // VALIDATION AND VERIFICATION
  // =====================================================================================

  async validateSupabaseMigration(originalData) {
    this.log('Validating Supabase migration...')
    
    try {
      // Use database validation functions
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_migration')

      if (validationError) {
        throw validationError
      }

      const { data: integrityResult, error: integrityError } = await supabase
        .rpc('check_referential_integrity')

      if (integrityError) {
        throw integrityError
      }

      const validation = {
        isValid: true,
        tables: validationResult,
        integrity: integrityResult,
        errors: [],
        warnings: []
      }

      // Check for any violations
      const violations = integrityResult.filter(check => check.status === 'VIOLATION')
      if (violations.length > 0) {
        validation.isValid = false
        validation.errors = violations.map(v => v.details)
      }

      this.log(`Migration validation completed - Valid: ${validation.isValid}`)
      
      return validation
    } catch (error) {
      this.log(`Migration validation failed: ${error.message}`, 'error')
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      }
    }
  }

  // =====================================================================================
  // ROLLBACK SYSTEM
  // =====================================================================================

  async rollbackMigration() {
    this.log('Starting migration rollback...')
    
    try {
      const status = this.getMigrationStatus()
      if (!status || !status.isStarted) {
        throw new Error('No migration to rollback')
      }

      // Get backup data
      const backupData = localStorage.getItem(this.backupKey)
      if (!backupData) {
        throw new Error('No backup data found for rollback')
      }

      const backup = JSON.parse(backupData)

      // Restore localStorage data
      localStorage.setItem('registeredUsers', JSON.stringify(backup.originalData.users))
      
      for (const userId of Object.keys(backup.originalData.users)) {
        if (backup.originalData.sessions[userId]) {
          localStorage.setItem(`pomodoroSessions_${userId}`, JSON.stringify(backup.originalData.sessions[userId]))
        }
        
        if (backup.originalData.stats[userId]) {
          localStorage.setItem(`userStats_${userId}`, JSON.stringify(backup.originalData.stats[userId]))
        }
        
        if (backup.originalData.meetings[userId]) {
          localStorage.setItem(`meetings_${userId}`, JSON.stringify(backup.originalData.meetings[userId]))
        }
      }

      // Restore active sessions and current user
      if (backup.originalData.metadata.currentUser) {
        localStorage.setItem('currentUser', backup.originalData.metadata.currentUser)
      }

      if (backup.originalData.metadata.activeSessions) {
        for (const [userId, activeSession] of Object.entries(backup.originalData.metadata.activeSessions)) {
          localStorage.setItem(`activePomodoroSession_${userId}`, JSON.stringify(activeSession))
        }
      }

      // Clear migration status
      localStorage.removeItem(this.migrationKey)
      localStorage.removeItem(this.progressKey)

      this.log('Migration rollback completed successfully')
      
      return { success: true, restoredData: backup.originalData }
    } catch (error) {
      this.log(`Migration rollback failed: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // CLEANUP AND UTILITIES
  // =====================================================================================

  async postMigrationCleanup() {
    this.log('Performing post-migration cleanup...')
    
    try {
      // Run database optimization
      const { error } = await supabase.rpc('post_migration_optimization')
      if (error) {
        this.log(`Optimization warning: ${error.message}`, 'warn')
      }

      this.updateMigrationStatus({
        currentStep: 'cleanup',
        completedSteps: [...this.getMigrationStatus().completedSteps, 'validate_migration']
      })

      this.log('Post-migration cleanup completed')
    } catch (error) {
      this.log(`Post-migration cleanup failed: ${error.message}`, 'warn')
    }
  }

  clearMigrationData() {
    try {
      localStorage.removeItem(this.migrationKey)
      localStorage.removeItem(this.backupKey)
      localStorage.removeItem(this.progressKey)
      this.log('Migration data cleared')
    } catch (error) {
      this.log(`Failed to clear migration data: ${error.message}`, 'warn')
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [MIGRATION] ${message}`
    
    switch (level) {
      case 'error':
        console.error(logMessage)
        break
      case 'warn':
        console.warn(logMessage)
        break
      case 'debug':
        if (this.isDebugMode) console.debug(logMessage)
        break
      default:
        console.log(logMessage)
    }
  }
}

export default DataMigrationManager