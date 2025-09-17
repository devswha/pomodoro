/**
 * Hybrid User Manager for Gradual Migration
 * Seamless integration between localStorage and Supabase during migration
 * 
 * Features:
 * - Dual-source data management (localStorage + Supabase)
 * - Progressive user migration with fallback
 * - Automatic data synchronization
 * - Migration status tracking per user
 * - Conflict resolution and data consistency
 * - Performance optimization with caching
 */

import { UserManager } from '../services/UserManager'
import { SupabaseUserManager } from '../services/SupabaseUserManager'
import { supabase } from '../supabase'

export class HybridUserManager {
  constructor() {
    this.localStorageManager = new UserManager()
    this.supabaseManager = new SupabaseUserManager()
    this.migrationStatusKey = 'hybridMigrationStatus'
    this.userMigrationKey = 'userMigrationStatus'
    this.syncQueue = []
    this.isDebugMode = process.env.NODE_ENV === 'development'
    
    // Initialize hybrid mode
    this.initializeHybridMode()
  }

  // =====================================================================================
  // INITIALIZATION AND CONFIGURATION
  // =====================================================================================

  initializeHybridMode() {
    this.log('Initializing hybrid mode...')
    
    // Set up periodic sync
    this.setupPeriodicSync()
    
    // Set up connection monitoring
    this.setupConnectionMonitoring()
    
    // Initialize migration status tracking
    this.initializeMigrationTracking()
  }

  setupPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(async () => {
      if (this.isOnline()) {
        await this.processSyncQueue()
      }
    }, 5 * 60 * 1000)
  }

  setupConnectionMonitoring() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', async () => {
        this.log('Connection restored, processing sync queue')
        await this.processSyncQueue()
      })
      
      window.addEventListener('offline', () => {
        this.log('Connection lost, switching to localStorage-only mode')
      })
    }
  }

  initializeMigrationTracking() {
    const status = this.getMigrationStatus()
    if (!status) {
      const initialStatus = {
        mode: 'hybrid',
        startTime: new Date().toISOString(),
        totalUsers: 0,
        migratedUsers: 0,
        failedUsers: [],
        lastSync: null
      }
      this.updateMigrationStatus(initialStatus)
    }
  }

  // =====================================================================================
  // USER MANAGEMENT WITH HYBRID LOGIC
  // =====================================================================================

  async registerUser(userId, userData) {
    this.log(`Registering user: ${userId}`)
    
    try {
      // Always register in localStorage first for immediate availability
      const localResult = await this.localStorageManager.registerUser(userId, userData)
      
      // Mark user as needing migration
      this.markUserForMigration(userId, 'registration')
      
      // Try to register in Supabase if online
      if (this.isOnline()) {
        try {
          await this.supabaseManager.registerUser(userId, userData)
          this.markUserAsMigrated(userId, 'registration')
          this.log(`User ${userId} registered in both systems`)
        } catch (supabaseError) {
          this.log(`User ${userId} registered locally only: ${supabaseError.message}`, 'warn')
          this.addToSyncQueue('register', userId, userData)
        }
      } else {
        this.addToSyncQueue('register', userId, userData)
      }
      
      return localResult
    } catch (error) {
      this.log(`User registration failed: ${error.message}`, 'error')
      throw error
    }
  }

  async loginUser(userId, password, rememberMe = false) {
    this.log(`Attempting login for user: ${userId}`)
    
    try {
      // Check if user has been migrated to Supabase
      const userMigrationStatus = this.getUserMigrationStatus(userId)
      
      if (userMigrationStatus?.migrated && this.isOnline()) {
        try {
          // Try Supabase login first
          const supabaseResult = await this.supabaseManager.loginUser(userId, password, rememberMe)
          
          // Sync any local changes to Supabase
          await this.syncUserData(userId)
          
          return supabaseResult
        } catch (supabaseError) {
          this.log(`Supabase login failed, falling back to localStorage: ${supabaseError.message}`, 'warn')
          
          // Fall back to localStorage
          return await this.localStorageManager.loginUser(userId, password, rememberMe)
        }
      } else {
        // Use localStorage and attempt background migration
        const localResult = await this.localStorageManager.loginUser(userId, password, rememberMe)
        
        // Schedule background migration
        this.scheduleUserMigration(userId)
        
        return localResult
      }
    } catch (error) {
      this.log(`Login failed: ${error.message}`, 'error')
      throw error
    }
  }

  async getCurrentUser() {
    try {
      // Check if current user has been migrated
      const currentUserId = this.localStorageManager.getCurrentSession()?.userId
      if (!currentUserId) return null

      const userMigrationStatus = this.getUserMigrationStatus(currentUserId)
      
      if (userMigrationStatus?.migrated && this.isOnline()) {
        try {
          return await this.supabaseManager.getCurrentUser()
        } catch (supabaseError) {
          this.log(`Failed to get current user from Supabase, using localStorage: ${supabaseError.message}`, 'warn')
        }
      }
      
      return this.localStorageManager.getUser(currentUserId)
    } catch (error) {
      this.log(`Failed to get current user: ${error.message}`, 'error')
      return null
    }
  }

  // =====================================================================================
  // DATA OPERATIONS WITH HYBRID LOGIC
  // =====================================================================================

  async getUserStats(userId) {
    try {
      const userMigrationStatus = this.getUserMigrationStatus(userId)
      
      if (userMigrationStatus?.migrated && this.isOnline()) {
        try {
          const supabaseStats = await this.supabaseManager.getUserStats(userId)
          
          // Merge with any local changes
          const localStats = this.localStorageManager.getUserStats(userId)
          return this.mergeStats(supabaseStats, localStats)
        } catch (supabaseError) {
          this.log(`Failed to get stats from Supabase: ${supabaseError.message}`, 'warn')
        }
      }
      
      // Use localStorage stats
      return this.localStorageManager.getUserStats(userId)
    } catch (error) {
      this.log(`Failed to get user stats: ${error.message}`, 'error')
      return null
    }
  }

  async createPomodoroSession(userId, sessionData) {
    this.log(`Creating pomodoro session for user: ${userId}`)
    
    try {
      // Always create in localStorage first
      const localSession = await this.localStorageManager.createPomodoroSession(userId, sessionData)
      
      const userMigrationStatus = this.getUserMigrationStatus(userId)
      
      if (userMigrationStatus?.migrated && this.isOnline()) {
        try {
          // Create in Supabase as well
          await this.supabaseManager.createPomodoroSession(userId, sessionData)
          this.log(`Session created in both systems for user: ${userId}`)
        } catch (supabaseError) {
          this.log(`Failed to create session in Supabase: ${supabaseError.message}`, 'warn')
          this.addToSyncQueue('createSession', userId, sessionData)
        }
      } else {
        // Add to sync queue for later migration
        this.addToSyncQueue('createSession', userId, sessionData)
      }
      
      return localSession
    } catch (error) {
      this.log(`Failed to create pomodoro session: ${error.message}`, 'error')
      throw error
    }
  }

  async completePomodoroSession(userId, sessionId) {
    this.log(`Completing pomodoro session: ${sessionId}`)
    
    try {
      // Complete in localStorage first
      const localResult = this.localStorageManager.completePomodoroSession(userId, sessionId)
      
      const userMigrationStatus = this.getUserMigrationStatus(userId)
      
      if (userMigrationStatus?.migrated && this.isOnline()) {
        try {
          // Complete in Supabase as well
          await this.supabaseManager.completePomodoroSession(userId, sessionId)
          this.log(`Session completed in both systems: ${sessionId}`)
        } catch (supabaseError) {
          this.log(`Failed to complete session in Supabase: ${supabaseError.message}`, 'warn')
          this.addToSyncQueue('completeSession', userId, { sessionId })
        }
      } else {
        this.addToSyncQueue('completeSession', userId, { sessionId })
      }
      
      return localResult
    } catch (error) {
      this.log(`Failed to complete pomodoro session: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // MIGRATION MANAGEMENT
  // =====================================================================================

  async migrateUser(userId, options = {}) {
    this.log(`Starting migration for user: ${userId}`)
    
    const {
      forceRemigration = false,
      syncOnly = false
    } = options

    try {
      const userMigrationStatus = this.getUserMigrationStatus(userId)
      
      // Skip if already migrated (unless forced)
      if (userMigrationStatus?.migrated && !forceRemigration) {
        this.log(`User ${userId} already migrated, skipping`)
        return { success: true, skipped: true }
      }

      // Get user data from localStorage
      const userData = this.localStorageManager.getUser(userId)
      if (!userData) {
        throw new Error(`User ${userId} not found in localStorage`)
      }

      const migrationResult = {
        userId: userId,
        success: false,
        operations: [],
        errors: []
      }

      // Migrate user profile
      try {
        if (!syncOnly) {
          await this.supabaseManager.registerUser(userId, {
            email: userData.email,
            password: userData.password || 'migrated_password',
            displayName: userData.displayName,
            preferences: userData.preferences
          })
          migrationResult.operations.push('user_profile')
        }
      } catch (error) {
        migrationResult.errors.push(`User profile: ${error.message}`)
      }

      // Migrate user statistics
      try {
        const userStats = this.localStorageManager.getUserStats(userId)
        if (userStats) {
          // Use Supabase RPC function for stats migration
          await supabase.rpc('migrate_user_stats_from_localstorage', {
            p_user_id: userId,
            p_stats_data: userStats
          })
          migrationResult.operations.push('user_stats')
        }
      } catch (error) {
        migrationResult.errors.push(`User stats: ${error.message}`)
      }

      // Migrate pomodoro sessions
      try {
        const userSessions = this.localStorageManager.getUserSessions(userId)
        if (userSessions && userSessions.length > 0) {
          await supabase.rpc('migrate_pomodoro_sessions_from_localstorage', {
            p_user_id: userId,
            p_sessions_data: userSessions
          })
          migrationResult.operations.push('pomodoro_sessions')
        }
      } catch (error) {
        migrationResult.errors.push(`Pomodoro sessions: ${error.message}`)
      }

      // Migrate meetings
      try {
        const userMeetings = this.localStorageManager.getMeetings(userId)
        if (userMeetings && userMeetings.length > 0) {
          await supabase.rpc('migrate_meetings_from_localstorage', {
            p_user_id: userId,
            p_meetings_data: userMeetings
          })
          migrationResult.operations.push('meetings')
        }
      } catch (error) {
        migrationResult.errors.push(`Meetings: ${error.message}`)
      }

      // Update migration status
      if (migrationResult.errors.length === 0) {
        migrationResult.success = true
        this.markUserAsMigrated(userId, 'full_migration')
        this.log(`User ${userId} migrated successfully`)
      } else {
        this.log(`User ${userId} migration completed with errors: ${migrationResult.errors.join(', ')}`, 'warn')
      }

      return migrationResult
    } catch (error) {
      this.log(`Migration failed for user ${userId}: ${error.message}`, 'error')
      throw error
    }
  }

  async scheduleUserMigration(userId) {
    if (!this.isOnline()) {
      this.addToSyncQueue('migrateUser', userId, {})
      return
    }

    try {
      // Run migration in background
      setTimeout(async () => {
        try {
          await this.migrateUser(userId)
        } catch (error) {
          this.log(`Background migration failed for user ${userId}: ${error.message}`, 'warn')
        }
      }, 1000) // Delay to avoid blocking UI
    } catch (error) {
      this.log(`Failed to schedule migration for user ${userId}: ${error.message}`, 'warn')
    }
  }

  async syncUserData(userId) {
    this.log(`Syncing data for user: ${userId}`)
    
    try {
      const userMigrationStatus = this.getUserMigrationStatus(userId)
      if (!userMigrationStatus?.migrated) {
        // If not migrated, perform full migration
        return await this.migrateUser(userId)
      }

      // Sync only changes since last sync
      const syncResult = {
        userId: userId,
        synced: [],
        errors: []
      }

      // Get last sync timestamp
      const lastSync = userMigrationStatus.lastSync
      const cutoffTime = lastSync ? new Date(lastSync) : new Date(0)

      // Sync recent sessions
      try {
        const recentSessions = this.localStorageManager.getUserSessions(userId)
          .filter(session => new Date(session.createdAt) > cutoffTime)
        
        if (recentSessions.length > 0) {
          for (const session of recentSessions) {
            await this.supabaseManager.createPomodoroSession(userId, session)
          }
          syncResult.synced.push(`${recentSessions.length} sessions`)
        }
      } catch (error) {
        syncResult.errors.push(`Sessions sync: ${error.message}`)
      }

      // Update last sync time
      this.updateUserMigrationStatus(userId, {
        lastSync: new Date().toISOString()
      })

      this.log(`Sync completed for user ${userId}: ${syncResult.synced.join(', ')}`)
      
      return syncResult
    } catch (error) {
      this.log(`Sync failed for user ${userId}: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // SYNC QUEUE MANAGEMENT
  // =====================================================================================

  addToSyncQueue(operation, userId, data) {
    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: operation,
      userId: userId,
      data: data,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    }

    this.syncQueue.push(queueItem)
    this.log(`Added to sync queue: ${operation} for user ${userId}`)
    
    // Try to process immediately if online
    if (this.isOnline()) {
      setTimeout(() => this.processSyncQueue(), 1000)
    }
  }

  async processSyncQueue() {
    if (this.syncQueue.length === 0 || !this.isOnline()) {
      return
    }

    this.log(`Processing sync queue: ${this.syncQueue.length} items`)
    
    const processedItems = []
    
    for (const item of this.syncQueue) {
      try {
        await this.processSyncItem(item)
        processedItems.push(item)
        this.log(`Processed sync item: ${item.operation} for user ${item.userId}`)
      } catch (error) {
        item.attempts++
        this.log(`Sync item failed (attempt ${item.attempts}): ${error.message}`, 'warn')
        
        if (item.attempts >= item.maxAttempts) {
          processedItems.push(item)
          this.log(`Sync item exceeded max attempts: ${item.operation} for user ${item.userId}`, 'error')
        }
      }
    }

    // Remove processed items from queue
    this.syncQueue = this.syncQueue.filter(item => !processedItems.includes(item))
  }

  async processSyncItem(item) {
    switch (item.operation) {
      case 'register':
        await this.supabaseManager.registerUser(item.userId, item.data)
        this.markUserAsMigrated(item.userId, 'registration')
        break
        
      case 'migrateUser':
        await this.migrateUser(item.userId, item.data)
        break
        
      case 'createSession':
        await this.supabaseManager.createPomodoroSession(item.userId, item.data)
        break
        
      case 'completeSession':
        await this.supabaseManager.completePomodoroSession(item.userId, item.data.sessionId)
        break
        
      default:
        throw new Error(`Unknown sync operation: ${item.operation}`)
    }
  }

  // =====================================================================================
  // MIGRATION STATUS TRACKING
  // =====================================================================================

  getMigrationStatus() {
    try {
      const status = localStorage.getItem(this.migrationStatusKey)
      return status ? JSON.parse(status) : null
    } catch (error) {
      return null
    }
  }

  updateMigrationStatus(updates) {
    try {
      const currentStatus = this.getMigrationStatus() || {}
      const newStatus = { ...currentStatus, ...updates }
      localStorage.setItem(this.migrationStatusKey, JSON.stringify(newStatus))
      return newStatus
    } catch (error) {
      this.log(`Failed to update migration status: ${error.message}`, 'warn')
      return null
    }
  }

  getUserMigrationStatus(userId) {
    try {
      const allStatus = JSON.parse(localStorage.getItem(this.userMigrationKey) || '{}')
      return allStatus[userId] || null
    } catch (error) {
      return null
    }
  }

  updateUserMigrationStatus(userId, updates) {
    try {
      const allStatus = JSON.parse(localStorage.getItem(this.userMigrationKey) || '{}')
      allStatus[userId] = { ...allStatus[userId], ...updates }
      localStorage.setItem(this.userMigrationKey, JSON.stringify(allStatus))
      return allStatus[userId]
    } catch (error) {
      this.log(`Failed to update user migration status: ${error.message}`, 'warn')
      return null
    }
  }

  markUserForMigration(userId, reason) {
    this.updateUserMigrationStatus(userId, {
      migrated: false,
      needsMigration: true,
      reason: reason,
      markedAt: new Date().toISOString()
    })
  }

  markUserAsMigrated(userId, operation) {
    this.updateUserMigrationStatus(userId, {
      migrated: true,
      migratedAt: new Date().toISOString(),
      operation: operation,
      needsMigration: false
    })

    // Update overall migration status
    const status = this.getMigrationStatus()
    if (status) {
      status.migratedUsers = (status.migratedUsers || 0) + 1
      this.updateMigrationStatus(status)
    }
  }

  // =====================================================================================
  // DATA MERGING AND CONFLICT RESOLUTION
  // =====================================================================================

  mergeStats(supabaseStats, localStats) {
    if (!localStats) return supabaseStats
    if (!supabaseStats) return localStats

    // Simple merge strategy - prefer more recent data
    const merged = { ...supabaseStats }

    // Check for newer local data
    const localUpdated = new Date(localStats.updatedAt || 0)
    const supabaseUpdated = new Date(supabaseStats.updatedAt || 0)

    if (localUpdated > supabaseUpdated) {
      // Local data is newer, merge selected fields
      merged.totalSessions = Math.max(merged.totalSessions || 0, localStats.totalSessions || 0)
      merged.completedSessions = Math.max(merged.completedSessions || 0, localStats.completedSessions || 0)
      merged.totalMinutes = Math.max(merged.totalMinutes || 0, localStats.totalMinutes || 0)
      merged.completedMinutes = Math.max(merged.completedMinutes || 0, localStats.completedMinutes || 0)
      
      // Use latest streak data
      if (localStats.lastSessionDate > supabaseStats.lastSessionDate) {
        merged.streakDays = localStats.streakDays
        merged.lastSessionDate = localStats.lastSessionDate
      }
    }

    return merged
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  async testConnection() {
    if (!this.isOnline()) return false
    
    try {
      const { error } = await supabase.from('users').select('count').limit(1)
      return !error
    } catch (error) {
      return false
    }
  }

  getHybridStatus() {
    return {
      mode: 'hybrid',
      online: this.isOnline(),
      migrationStatus: this.getMigrationStatus(),
      syncQueueSize: this.syncQueue.length,
      connectionTest: null // Would need to be populated by calling testConnection()
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [HYBRID] ${message}`
    
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

export default HybridUserManager