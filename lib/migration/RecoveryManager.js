/**
 * Recovery Manager for Pomodoro Timer Migration
 * Advanced rollback and recovery system with multiple safety layers
 * 
 * Features:
 * - Multi-tier backup strategy (localStorage, file download, cloud backup)
 * - Granular rollback (full, partial, user-specific)
 * - Recovery validation and integrity checks
 * - Progressive recovery with error handling
 * - Conflict resolution and data merging
 */

import { supabase } from '../supabase'

export class RecoveryManager {
  constructor() {
    this.backupKeys = {
      primary: 'pomodoroRecoveryBackup',
      metadata: 'pomodoroRecoveryMetadata',
      snapshots: 'pomodoroRecoverySnapshots'
    }
    this.maxSnapshots = 10
    this.isDebugMode = process.env.NODE_ENV === 'development'
  }

  // =====================================================================================
  // BACKUP CREATION AND MANAGEMENT
  // =====================================================================================

  async createFullBackup(source = 'localStorage', options = {}) {
    this.log('Creating full backup...')
    
    const {
      includeSnapshots = false,
      compressData = true,
      generateChecksum = true
    } = options

    try {
      const backup = {
        id: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        source: source,
        type: 'full',
        data: {},
        metadata: {
          userAgent: this.getBrowserInfo(),
          migrationStatus: this.getMigrationStatus(),
          dataIntegrity: null
        }
      }

      // Backup localStorage data
      if (source === 'localStorage') {
        backup.data = await this.backupLocalStorageData()
      } else if (source === 'supabase') {
        backup.data = await this.backupSupabaseData()
      }

      // Generate data integrity checksum
      if (generateChecksum) {
        backup.metadata.dataIntegrity = this.generateChecksum(backup.data)
      }

      // Compress data if requested
      if (compressData) {
        backup.data = this.compressData(backup.data)
        backup.metadata.compressed = true
      }

      // Store backup
      await this.storeBackup(backup)

      // Include snapshots if requested
      if (includeSnapshots) {
        await this.createSnapshot('full_backup_created', backup.id)
      }

      this.log(`Full backup created: ${backup.id}`)
      
      return backup
    } catch (error) {
      this.log(`Failed to create backup: ${error.message}`, 'error')
      throw new Error(`Backup creation failed: ${error.message}`)
    }
  }

  async createSnapshot(event, description = '') {
    this.log(`Creating snapshot for event: ${event}`)
    
    try {
      const snapshot = {
        id: this.generateSnapshotId(),
        timestamp: new Date().toISOString(),
        event: event,
        description: description,
        data: await this.backupLocalStorageData(),
        migrationState: this.getMigrationStatus()
      }

      // Get existing snapshots
      const snapshots = this.getStoredSnapshots()
      
      // Add new snapshot
      snapshots.push(snapshot)
      
      // Keep only the latest snapshots
      if (snapshots.length > this.maxSnapshots) {
        snapshots.splice(0, snapshots.length - this.maxSnapshots)
      }

      // Store updated snapshots
      localStorage.setItem(this.backupKeys.snapshots, JSON.stringify(snapshots))
      
      this.log(`Snapshot created: ${snapshot.id}`)
      
      return snapshot
    } catch (error) {
      this.log(`Failed to create snapshot: ${error.message}`, 'error')
      throw error
    }
  }

  async backupLocalStorageData() {
    const data = {
      users: {},
      sessions: {},
      stats: {},
      meetings: {},
      system: {}
    }

    try {
      // Backup registered users
      const registeredUsers = this.safeGetItem('registeredUsers')
      if (registeredUsers) {
        data.users = registeredUsers
      }

      // Backup system data
      data.system.currentUser = this.safeGetItem('currentUser')
      data.system.userSessions = this.safeGetItem('userSessions')

      // Backup user-specific data
      for (const userId of Object.keys(data.users)) {
        // Sessions
        const sessions = this.safeGetItem(`pomodoroSessions_${userId}`)
        if (sessions) {
          data.sessions[userId] = sessions
        }

        // Stats
        const stats = this.safeGetItem(`userStats_${userId}`)
        if (stats) {
          data.stats[userId] = stats
        }

        // Meetings
        const meetings = this.safeGetItem(`meetings_${userId}`)
        if (meetings) {
          data.meetings[userId] = meetings
        }

        // Active sessions
        const activeSession = this.safeGetItem(`activePomodoroSession_${userId}`)
        if (activeSession) {
          if (!data.system.activeSessions) {
            data.system.activeSessions = {}
          }
          data.system.activeSessions[userId] = activeSession
        }
      }

      return data
    } catch (error) {
      throw new Error(`Failed to backup localStorage: ${error.message}`)
    }
  }

  async backupSupabaseData() {
    const data = {
      users: [],
      sessions: [],
      stats: [],
      meetings: [],
      preferences: []
    }

    try {
      // Backup users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')

      if (usersError) throw usersError
      data.users = users

      // Backup sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('pomodoro_sessions')
        .select('*')

      if (sessionsError) throw sessionsError
      data.sessions = sessions

      // Backup stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')

      if (statsError) throw statsError
      data.stats = stats

      // Backup meetings
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')

      if (meetingsError) throw meetingsError
      data.meetings = meetings

      // Backup preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')

      if (prefsError) throw prefsError
      data.preferences = preferences

      return data
    } catch (error) {
      throw new Error(`Failed to backup Supabase: ${error.message}`)
    }
  }

  // =====================================================================================
  // ROLLBACK OPERATIONS
  // =====================================================================================

  async performFullRollback(backupId = null, options = {}) {
    this.log('Starting full rollback...')
    
    const {
      validateBeforeRollback = true,
      createPreRollbackSnapshot = true,
      skipIntegrityCheck = false
    } = options

    try {
      // Create snapshot before rollback
      if (createPreRollbackSnapshot) {
        await this.createSnapshot('pre_rollback', `Before rollback to ${backupId || 'latest'}`)
      }

      // Get backup to restore from
      const backup = backupId ? 
        await this.getBackupById(backupId) : 
        await this.getLatestBackup()

      if (!backup) {
        throw new Error('No backup found for rollback')
      }

      // Validate backup if required
      if (validateBeforeRollback && !skipIntegrityCheck) {
        const isValid = await this.validateBackup(backup)
        if (!isValid) {
          throw new Error('Backup validation failed')
        }
      }

      // Perform rollback
      const rollbackResult = await this.restoreFromBackup(backup)

      // Validate rollback success
      if (!skipIntegrityCheck) {
        const rollbackValidation = await this.validateRollback(backup, rollbackResult)
        if (!rollbackValidation.isValid) {
          throw new Error(`Rollback validation failed: ${rollbackValidation.errors.join(', ')}`)
        }
      }

      // Clear migration status
      this.clearMigrationStatus()

      // Create post-rollback snapshot
      await this.createSnapshot('post_rollback', `After rollback from ${backup.id}`)

      this.log(`Full rollback completed successfully from backup: ${backup.id}`)
      
      return {
        success: true,
        backupId: backup.id,
        rollbackResult: rollbackResult
      }
    } catch (error) {
      this.log(`Full rollback failed: ${error.message}`, 'error')
      throw error
    }
  }

  async performPartialRollback(userId, backupId = null, options = {}) {
    this.log(`Starting partial rollback for user: ${userId}`)
    
    try {
      const backup = backupId ? 
        await this.getBackupById(backupId) : 
        await this.getLatestBackup()

      if (!backup || !backup.data) {
        throw new Error('No valid backup found for partial rollback')
      }

      const result = {
        success: true,
        restoredData: {},
        errors: []
      }

      // Restore user data
      if (backup.data.users && backup.data.users[userId]) {
        // Update registered users
        const registeredUsers = this.safeGetItem('registeredUsers') || {}
        registeredUsers[userId] = backup.data.users[userId]
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))
        result.restoredData.user = true
      }

      // Restore user sessions
      if (backup.data.sessions && backup.data.sessions[userId]) {
        localStorage.setItem(`pomodoroSessions_${userId}`, JSON.stringify(backup.data.sessions[userId]))
        result.restoredData.sessions = true
      }

      // Restore user stats
      if (backup.data.stats && backup.data.stats[userId]) {
        localStorage.setItem(`userStats_${userId}`, JSON.stringify(backup.data.stats[userId]))
        result.restoredData.stats = true
      }

      // Restore user meetings
      if (backup.data.meetings && backup.data.meetings[userId]) {
        localStorage.setItem(`meetings_${userId}`, JSON.stringify(backup.data.meetings[userId]))
        result.restoredData.meetings = true
      }

      // Restore active session
      if (backup.data.system?.activeSessions?.[userId]) {
        localStorage.setItem(`activePomodoroSession_${userId}`, JSON.stringify(backup.data.system.activeSessions[userId]))
        result.restoredData.activeSession = true
      }

      this.log(`Partial rollback completed for user: ${userId}`)
      
      return result
    } catch (error) {
      this.log(`Partial rollback failed for user ${userId}: ${error.message}`, 'error')
      throw error
    }
  }

  async performConflictResolution(conflicts, strategy = 'preserve_local') {
    this.log(`Resolving ${conflicts.length} conflicts with strategy: ${strategy}`)
    
    const resolutionResult = {
      resolved: 0,
      failed: 0,
      actions: []
    }

    try {
      for (const conflict of conflicts) {
        try {
          const action = await this.resolveConflict(conflict, strategy)
          resolutionResult.actions.push(action)
          resolutionResult.resolved++
        } catch (error) {
          resolutionResult.actions.push({
            conflict: conflict,
            status: 'failed',
            error: error.message
          })
          resolutionResult.failed++
        }
      }

      this.log(`Conflict resolution completed - Resolved: ${resolutionResult.resolved}, Failed: ${resolutionResult.failed}`)
      
      return resolutionResult
    } catch (error) {
      this.log(`Conflict resolution failed: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // DATA RESTORATION
  // =====================================================================================

  async restoreFromBackup(backup) {
    this.log('Restoring data from backup...')
    
    try {
      const result = {
        restoredUsers: 0,
        restoredSessions: 0,
        restoredStats: 0,
        restoredMeetings: 0,
        errors: []
      }

      // Decompress data if needed
      let data = backup.data
      if (backup.metadata?.compressed) {
        data = this.decompressData(data)
      }

      // Restore registered users
      if (data.users) {
        localStorage.setItem('registeredUsers', JSON.stringify(data.users))
        result.restoredUsers = Object.keys(data.users).length
      }

      // Restore system data
      if (data.system) {
        if (data.system.currentUser) {
          localStorage.setItem('currentUser', data.system.currentUser)
        }
        
        if (data.system.userSessions) {
          localStorage.setItem('userSessions', JSON.stringify(data.system.userSessions))
        }
      }

      // Restore user-specific data
      for (const userId of Object.keys(data.users || {})) {
        try {
          // Restore sessions
          if (data.sessions?.[userId]) {
            localStorage.setItem(`pomodoroSessions_${userId}`, JSON.stringify(data.sessions[userId]))
            result.restoredSessions += data.sessions[userId].length
          }

          // Restore stats
          if (data.stats?.[userId]) {
            localStorage.setItem(`userStats_${userId}`, JSON.stringify(data.stats[userId]))
            result.restoredStats++
          }

          // Restore meetings
          if (data.meetings?.[userId]) {
            localStorage.setItem(`meetings_${userId}`, JSON.stringify(data.meetings[userId]))
            result.restoredMeetings += data.meetings[userId].length
          }

          // Restore active sessions
          if (data.system?.activeSessions?.[userId]) {
            localStorage.setItem(`activePomodoroSession_${userId}`, JSON.stringify(data.system.activeSessions[userId]))
          }
        } catch (userError) {
          result.errors.push(`Failed to restore data for user ${userId}: ${userError.message}`)
        }
      }

      this.log('Data restoration completed')
      
      return result
    } catch (error) {
      this.log(`Data restoration failed: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // VALIDATION AND INTEGRITY CHECKS
  // =====================================================================================

  async validateBackup(backup) {
    this.log('Validating backup integrity...')
    
    try {
      // Check basic structure
      if (!backup || !backup.data || !backup.timestamp) {
        return false
      }

      // Verify checksum if available
      if (backup.metadata?.dataIntegrity) {
        const currentChecksum = this.generateChecksum(backup.data)
        if (currentChecksum !== backup.metadata.dataIntegrity) {
          this.log('Backup checksum validation failed', 'error')
          return false
        }
      }

      // Validate data structure
      const data = backup.metadata?.compressed ? 
        this.decompressData(backup.data) : backup.data

      if (!data.users || typeof data.users !== 'object') {
        this.log('Invalid backup data structure', 'error')
        return false
      }

      this.log('Backup validation passed')
      return true
    } catch (error) {
      this.log(`Backup validation failed: ${error.message}`, 'error')
      return false
    }
  }

  async validateRollback(backup, rollbackResult) {
    this.log('Validating rollback success...')
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Check if users were restored
      const restoredUsers = this.safeGetItem('registeredUsers')
      const expectedUsers = backup.metadata?.compressed ? 
        this.decompressData(backup.data).users : backup.data.users

      if (!restoredUsers || Object.keys(restoredUsers).length !== Object.keys(expectedUsers || {}).length) {
        validation.errors.push('User count mismatch after rollback')
        validation.isValid = false
      }

      // Validate user data integrity
      for (const [userId, expectedUserData] of Object.entries(expectedUsers || {})) {
        const restoredUserData = restoredUsers[userId]
        
        if (!restoredUserData) {
          validation.errors.push(`User ${userId} not found after rollback`)
          validation.isValid = false
          continue
        }

        // Check critical fields
        if (restoredUserData.email !== expectedUserData.email) {
          validation.errors.push(`Email mismatch for user ${userId}`)
          validation.isValid = false
        }
      }

      this.log(`Rollback validation completed - Valid: ${validation.isValid}`)
      
      return validation
    } catch (error) {
      validation.isValid = false
      validation.errors.push(`Rollback validation failed: ${error.message}`)
      return validation
    }
  }

  // =====================================================================================
  // BACKUP STORAGE AND RETRIEVAL
  // =====================================================================================

  async storeBackup(backup) {
    try {
      // Store in localStorage
      localStorage.setItem(this.backupKeys.primary, JSON.stringify(backup))
      
      // Update metadata
      const metadata = this.getBackupMetadata()
      metadata.backups.push({
        id: backup.id,
        timestamp: backup.timestamp,
        type: backup.type,
        size: JSON.stringify(backup).length
      })
      
      // Keep only recent backups metadata
      if (metadata.backups.length > 20) {
        metadata.backups = metadata.backups.slice(-20)
      }
      
      localStorage.setItem(this.backupKeys.metadata, JSON.stringify(metadata))
      
      // Download backup file
      this.downloadBackupFile(backup)
      
      this.log(`Backup stored: ${backup.id}`)
    } catch (error) {
      throw new Error(`Failed to store backup: ${error.message}`)
    }
  }

  async getBackupById(backupId) {
    try {
      const backup = this.safeGetItem(this.backupKeys.primary)
      if (backup && backup.id === backupId) {
        return backup
      }
      
      // Check snapshots
      const snapshots = this.getStoredSnapshots()
      const snapshot = snapshots.find(s => s.id === backupId)
      if (snapshot) {
        return {
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          type: 'snapshot',
          data: snapshot.data,
          metadata: { source: 'snapshot' }
        }
      }
      
      return null
    } catch (error) {
      this.log(`Failed to get backup ${backupId}: ${error.message}`, 'error')
      return null
    }
  }

  async getLatestBackup() {
    try {
      return this.safeGetItem(this.backupKeys.primary)
    } catch (error) {
      this.log(`Failed to get latest backup: ${error.message}`, 'error')
      return null
    }
  }

  getStoredSnapshots() {
    try {
      return this.safeGetItem(this.backupKeys.snapshots) || []
    } catch (error) {
      this.log(`Failed to get snapshots: ${error.message}`, 'error')
      return []
    }
  }

  getBackupMetadata() {
    try {
      return this.safeGetItem(this.backupKeys.metadata) || { backups: [] }
    } catch (error) {
      return { backups: [] }
    }
  }

  // =====================================================================================
  // CONFLICT RESOLUTION
  // =====================================================================================

  async resolveConflict(conflict, strategy) {
    const action = {
      conflict: conflict,
      strategy: strategy,
      resolution: null,
      status: 'resolved'
    }

    try {
      switch (strategy) {
        case 'preserve_local':
          // Keep the local (current) data
          action.resolution = 'kept_local_data'
          break
          
        case 'prefer_backup':
          // Use the backup data
          await this.applyBackupValue(conflict.key, conflict.backupValue)
          action.resolution = 'used_backup_data'
          break
          
        case 'merge_data':
          // Attempt to merge the data
          const mergedValue = await this.mergeConflictData(conflict.localValue, conflict.backupValue)
          await this.applyBackupValue(conflict.key, mergedValue)
          action.resolution = 'merged_data'
          break
          
        case 'ask_user':
          // This would require user interaction in a real implementation
          throw new Error('User interaction required - not implemented in this context')
          
        default:
          throw new Error(`Unknown conflict resolution strategy: ${strategy}`)
      }

      return action
    } catch (error) {
      action.status = 'failed'
      action.error = error.message
      throw error
    }
  }

  async applyBackupValue(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    } catch (error) {
      throw new Error(`Failed to apply backup value for ${key}: ${error.message}`)
    }
  }

  async mergeConflictData(localValue, backupValue) {
    // Simple merge strategy - in a real implementation this would be more sophisticated
    if (typeof localValue === 'object' && typeof backupValue === 'object') {
      return { ...backupValue, ...localValue } // Local takes precedence
    }
    
    // For non-objects, prefer the newer timestamp if available
    if (localValue?.updatedAt && backupValue?.updatedAt) {
      return new Date(localValue.updatedAt) > new Date(backupValue.updatedAt) ? 
        localValue : backupValue
    }
    
    // Default to local value
    return localValue
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateSnapshotId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateChecksum(data) {
    // Simple checksum implementation - in production use a proper hashing library
    const jsonString = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  compressData(data) {
    // Simple compression - in production use a proper compression library
    return JSON.stringify(data)
  }

  decompressData(compressedData) {
    // Simple decompression
    return JSON.parse(compressedData)
  }

  downloadBackupFile(backup) {
    try {
      if (typeof window === 'undefined' || !document) return

      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `pomodoro-backup-${backup.id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      this.log(`Backup file downloaded: ${backup.id}`)
    } catch (error) {
      this.log(`Failed to download backup file: ${error.message}`, 'warn')
    }
  }

  safeGetItem(key) {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return null
      
      try {
        return JSON.parse(item)
      } catch (parseError) {
        return item
      }
    } catch (error) {
      return null
    }
  }

  getMigrationStatus() {
    return this.safeGetItem('pomodoroMigrationStatus')
  }

  clearMigrationStatus() {
    try {
      localStorage.removeItem('pomodoroMigrationStatus')
      localStorage.removeItem('pomodoroMigrationProgress')
    } catch (error) {
      this.log(`Failed to clear migration status: ${error.message}`, 'warn')
    }
  }

  getBrowserInfo() {
    try {
      if (typeof navigator === 'undefined') return 'Unknown'
      
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    } catch (error) {
      return 'Unknown'
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [RECOVERY] ${message}`
    
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

export default RecoveryManager