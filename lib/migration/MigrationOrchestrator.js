/**
 * Migration Orchestrator for Pomodoro Timer
 * Central coordination system for all migration components
 * 
 * Features:
 * - Unified migration API and workflow management
 * - Component coordination (extractor, validator, manager, recovery)
 * - Migration strategy selection and execution
 * - Real-time progress reporting and error handling
 * - Rollback coordination and hybrid mode management
 */

import { DataMigrationManager } from './DataMigrationManager'
import { LocalStorageExtractor } from './LocalStorageExtractor'
import { DataValidator } from './DataValidator'
import { RecoveryManager } from './RecoveryManager'
import { HybridUserManager } from './HybridUserManager'

export class MigrationOrchestrator {
  constructor(options = {}) {
    this.options = {
      strategy: 'safe', // 'safe', 'fast', 'hybrid'
      autoBackup: true,
      validateData: true,
      enableHybridMode: true,
      batchSize: 10,
      retryAttempts: 3,
      ...options
    }

    // Initialize components
    this.migrationManager = new DataMigrationManager()
    this.extractor = new LocalStorageExtractor()
    this.validator = new DataValidator()
    this.recoveryManager = new RecoveryManager()
    this.hybridManager = this.options.enableHybridMode ? new HybridUserManager() : null

    // State management
    this.currentOperation = null
    this.operationHistory = []
    this.listeners = new Map()
    this.isDebugMode = process.env.NODE_ENV === 'development'

    this.log('Migration Orchestrator initialized')
  }

  // =====================================================================================
  // PUBLIC API METHODS
  // =====================================================================================

  async startMigration(migrationOptions = {}) {
    const options = { ...this.options, ...migrationOptions }
    const operationId = this.generateOperationId('migration')
    
    this.log(`Starting migration with strategy: ${options.strategy}`)
    
    try {
      this.setCurrentOperation({
        id: operationId,
        type: 'migration',
        strategy: options.strategy,
        startTime: new Date().toISOString(),
        status: 'running'
      })

      let result
      switch (options.strategy) {
        case 'safe':
          result = await this.executeSafeMigration(options)
          break
        case 'fast':
          result = await this.executeFastMigration(options)
          break
        case 'hybrid':
          result = await this.executeHybridMigration(options)
          break
        default:
          throw new Error(`Unknown migration strategy: ${options.strategy}`)
      }

      this.completeOperation(operationId, result)
      this.emit('migrationComplete', result)
      
      return result
    } catch (error) {
      this.failOperation(operationId, error)
      this.emit('migrationError', error)
      throw error
    }
  }

  async performHealthCheck() {
    const operationId = this.generateOperationId('healthCheck')
    
    this.log('Performing comprehensive health check...')
    
    try {
      this.setCurrentOperation({
        id: operationId,
        type: 'healthCheck',
        startTime: new Date().toISOString(),
        status: 'running'
      })

      const healthResult = {
        timestamp: new Date().toISOString(),
        overall: 'healthy',
        components: {},
        recommendations: []
      }

      // Data scan
      this.emit('healthCheckProgress', { step: 'scanning', progress: 10 })
      const scanResults = this.extractor.scanLocalStorage()
      healthResult.components.dataScanning = {
        status: scanResults.statistics.totalUsers > 0 ? 'healthy' : 'no_data',
        details: scanResults.statistics
      }

      // Data extraction test
      this.emit('healthCheckProgress', { step: 'extraction', progress: 30 })
      if (scanResults.statistics.totalUsers > 0) {
        const extractionResults = this.extractor.extractAllData()
        healthResult.components.dataExtraction = {
          status: 'healthy',
          details: extractionResults.metadata.statistics
        }

        // Data validation
        this.emit('healthCheckProgress', { step: 'validation', progress: 50 })
        const validationResults = await this.validator.validateCompleteDataset(extractionResults)
        healthResult.components.dataValidation = {
          status: validationResults.isValid ? 'healthy' : 'issues_found',
          score: validationResults.score,
          details: {
            errors: validationResults.errors.length,
            warnings: validationResults.warnings.length
          }
        }

        // Generate recommendations based on validation
        if (validationResults.score < 80) {
          healthResult.recommendations.push({
            type: 'data_quality',
            severity: 'medium',
            message: 'Data quality issues detected. Consider reviewing before migration.'
          })
        }
      }

      // Connection test
      this.emit('healthCheckProgress', { step: 'connectivity', progress: 70 })
      const isOnline = navigator.onLine
      const supabaseConnected = this.hybridManager ? await this.hybridManager.testConnection() : false
      
      healthResult.components.connectivity = {
        status: supabaseConnected ? 'healthy' : 'offline',
        details: { online: isOnline, supabaseConnected }
      }

      if (!supabaseConnected) {
        healthResult.recommendations.push({
          type: 'connectivity',
          severity: 'high',
          message: 'No connection to Supabase. Migration will be queued until connection is restored.'
        })
      }

      // Backup system test
      this.emit('healthCheckProgress', { step: 'backup', progress: 90 })
      try {
        await this.recoveryManager.createSnapshot('health_check', 'Health check snapshot')
        healthResult.components.backupSystem = { status: 'healthy' }
      } catch (error) {
        healthResult.components.backupSystem = {
          status: 'error',
          error: error.message
        }
        healthResult.recommendations.push({
          type: 'backup',
          severity: 'high',
          message: 'Backup system not functioning. Migration without backup is risky.'
        })
      }

      // Determine overall health
      const componentStatuses = Object.values(healthResult.components).map(c => c.status)
      if (componentStatuses.includes('error')) {
        healthResult.overall = 'critical'
      } else if (componentStatuses.includes('issues_found') || componentStatuses.includes('offline')) {
        healthResult.overall = 'issues'
      }

      this.emit('healthCheckProgress', { step: 'complete', progress: 100 })
      this.completeOperation(operationId, healthResult)
      
      this.log(`Health check completed - Overall: ${healthResult.overall}`)
      
      return healthResult
    } catch (error) {
      this.failOperation(operationId, error)
      throw error
    }
  }

  async rollbackMigration(backupId = null, options = {}) {
    const operationId = this.generateOperationId('rollback')
    
    this.log(`Starting rollback${backupId ? ` to backup: ${backupId}` : ' to latest backup'}`)
    
    try {
      this.setCurrentOperation({
        id: operationId,
        type: 'rollback',
        backupId: backupId,
        startTime: new Date().toISOString(),
        status: 'running'
      })

      const rollbackResult = await this.recoveryManager.performFullRollback(backupId, options)
      
      this.completeOperation(operationId, rollbackResult)
      this.emit('rollbackComplete', rollbackResult)
      
      return rollbackResult
    } catch (error) {
      this.failOperation(operationId, error)
      this.emit('rollbackError', error)
      throw error
    }
  }

  async enableHybridMode() {
    if (this.hybridManager) {
      this.log('Hybrid mode already enabled')
      return { success: true, alreadyEnabled: true }
    }

    this.log('Enabling hybrid mode...')
    
    try {
      this.hybridManager = new HybridUserManager()
      this.options.enableHybridMode = true
      
      this.emit('hybridModeEnabled', { timestamp: new Date().toISOString() })
      
      return { success: true, enabled: true }
    } catch (error) {
      this.log(`Failed to enable hybrid mode: ${error.message}`, 'error')
      throw error
    }
  }

  async disableHybridMode() {
    if (!this.hybridManager) {
      return { success: true, alreadyDisabled: true }
    }

    this.log('Disabling hybrid mode...')
    
    try {
      // Ensure all sync operations are complete
      if (this.hybridManager.syncQueue.length > 0) {
        await this.hybridManager.processSyncQueue()
      }

      this.hybridManager = null
      this.options.enableHybridMode = false
      
      this.emit('hybridModeDisabled', { timestamp: new Date().toISOString() })
      
      return { success: true, disabled: true }
    } catch (error) {
      this.log(`Failed to disable hybrid mode: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // MIGRATION STRATEGY IMPLEMENTATIONS
  // =====================================================================================

  async executeSafeMigration(options) {
    this.log('Executing safe migration strategy...')
    
    const result = {
      strategy: 'safe',
      steps: [],
      success: false
    }

    try {
      // Step 1: Create full backup
      this.emit('migrationProgress', { step: 'backup', progress: 10 })
      const backup = await this.recoveryManager.createFullBackup('localStorage', {
        includeSnapshots: true,
        generateChecksum: true
      })
      result.steps.push({ step: 'backup', success: true, backupId: backup.id })

      // Step 2: Export and validate data
      this.emit('migrationProgress', { step: 'export', progress: 25 })
      const exportData = this.extractor.extractAllData()
      result.steps.push({ step: 'export', success: true })

      this.emit('migrationProgress', { step: 'validate', progress: 40 })
      const validation = await this.validator.validateCompleteDataset(exportData)
      if (!validation.isValid && !options.ignoreValidationErrors) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`)
      }
      result.steps.push({ step: 'validate', success: validation.isValid, score: validation.score })

      // Step 3: Execute migration
      this.emit('migrationProgress', { step: 'migrate', progress: 60 })
      const migrationResult = await this.migrationManager.startMigration({
        skipBackup: true, // We already created our own backup
        dryRun: false,
        batchSize: options.batchSize
      })
      result.steps.push({ step: 'migrate', success: true, result: migrationResult })

      // Step 4: Post-migration validation
      this.emit('migrationProgress', { step: 'verify', progress: 80 })
      const postValidation = await this.migrationManager.validateSupabaseMigration(exportData)
      if (!postValidation.isValid) {
        // Auto-rollback on validation failure
        this.log('Post-migration validation failed, rolling back...', 'warn')
        await this.recoveryManager.performFullRollback(backup.id)
        throw new Error('Migration validation failed, rolled back to backup')
      }
      result.steps.push({ step: 'verify', success: postValidation.isValid })

      // Step 5: Enable hybrid mode for gradual transition
      if (options.enableHybridMode !== false) {
        this.emit('migrationProgress', { step: 'hybrid', progress: 95 })
        await this.enableHybridMode()
        result.steps.push({ step: 'hybrid', success: true })
      }

      this.emit('migrationProgress', { step: 'complete', progress: 100 })
      result.success = true
      
      return result
    } catch (error) {
      result.error = error.message
      throw error
    }
  }

  async executeFastMigration(options) {
    this.log('Executing fast migration strategy...')
    
    const result = {
      strategy: 'fast',
      steps: [],
      success: false
    }

    try {
      // Minimal backup
      this.emit('migrationProgress', { step: 'backup', progress: 5 })
      const backup = await this.recoveryManager.createSnapshot('fast_migration', 'Pre-fast-migration snapshot')
      result.steps.push({ step: 'backup', success: true, snapshotId: backup.id })

      // Direct migration without extensive validation
      this.emit('migrationProgress', { step: 'migrate', progress: 30 })
      const migrationResult = await this.migrationManager.startMigration({
        skipBackup: false,
        dryRun: false,
        batchSize: options.batchSize * 2 // Larger batches for speed
      })
      result.steps.push({ step: 'migrate', success: true, result: migrationResult })

      this.emit('migrationProgress', { step: 'complete', progress: 100 })
      result.success = true
      
      return result
    } catch (error) {
      result.error = error.message
      throw error
    }
  }

  async executeHybridMigration(options) {
    this.log('Executing hybrid migration strategy...')
    
    const result = {
      strategy: 'hybrid',
      steps: [],
      success: false
    }

    try {
      // Step 1: Enable hybrid mode first
      this.emit('migrationProgress', { step: 'enable_hybrid', progress: 10 })
      await this.enableHybridMode()
      result.steps.push({ step: 'enable_hybrid', success: true })

      // Step 2: Progressive user migration
      this.emit('migrationProgress', { step: 'progressive_migration', progress: 30 })
      const users = this.extractor.extractAllData().users
      const userIds = Object.keys(users)
      let migratedCount = 0

      for (const userId of userIds) {
        try {
          await this.hybridManager.migrateUser(userId)
          migratedCount++
          
          const progress = 30 + (migratedCount / userIds.length) * 60
          this.emit('migrationProgress', { 
            step: 'progressive_migration', 
            progress: Math.round(progress),
            detail: `${migratedCount}/${userIds.length} users migrated`
          })
        } catch (error) {
          this.log(`Failed to migrate user ${userId}: ${error.message}`, 'warn')
        }
      }

      result.steps.push({ 
        step: 'progressive_migration', 
        success: true, 
        migratedUsers: migratedCount,
        totalUsers: userIds.length
      })

      this.emit('migrationProgress', { step: 'complete', progress: 100 })
      result.success = true
      
      return result
    } catch (error) {
      result.error = error.message
      throw error
    }
  }

  // =====================================================================================
  // OPERATION MANAGEMENT
  // =====================================================================================

  generateOperationId(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setCurrentOperation(operation) {
    this.currentOperation = operation
    this.emit('operationStart', operation)
  }

  completeOperation(operationId, result) {
    if (this.currentOperation?.id === operationId) {
      this.currentOperation.status = 'completed'
      this.currentOperation.endTime = new Date().toISOString()
      this.currentOperation.result = result
      
      this.operationHistory.push({ ...this.currentOperation })
      this.currentOperation = null
      
      this.emit('operationComplete', { operationId, result })
    }
  }

  failOperation(operationId, error) {
    if (this.currentOperation?.id === operationId) {
      this.currentOperation.status = 'failed'
      this.currentOperation.endTime = new Date().toISOString()
      this.currentOperation.error = error.message
      
      this.operationHistory.push({ ...this.currentOperation })
      this.currentOperation = null
      
      this.emit('operationError', { operationId, error })
    }
  }

  // =====================================================================================
  // STATUS AND MONITORING
  // =====================================================================================

  getStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      currentOperation: this.currentOperation,
      hybridMode: {
        enabled: !!this.hybridManager,
        status: this.hybridManager ? this.hybridManager.getHybridStatus() : null
      },
      migrationHistory: this.operationHistory.filter(op => op.type === 'migration'),
      components: {
        extractor: 'available',
        validator: 'available',
        migrationManager: 'available',
        recoveryManager: 'available',
        hybridManager: this.hybridManager ? 'available' : 'disabled'
      },
      options: this.options
    }

    return status
  }

  getOperationHistory() {
    return [...this.operationHistory]
  }

  // =====================================================================================
  // EVENT SYSTEM
  // =====================================================================================

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data)
        } catch (error) {
          this.log(`Event callback error for ${event}: ${error.message}`, 'error')
        }
      }
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  async cleanup() {
    this.log('Cleaning up migration orchestrator...')
    
    try {
      // Clear current operation
      this.currentOperation = null
      
      // Clear event listeners
      this.listeners.clear()
      
      // Cleanup hybrid manager if enabled
      if (this.hybridManager) {
        await this.disableHybridMode()
      }
      
      this.log('Migration orchestrator cleanup completed')
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error')
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [ORCHESTRATOR] ${message}`
    
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

export default MigrationOrchestrator