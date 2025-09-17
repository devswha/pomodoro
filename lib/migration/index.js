/**
 * Pomodoro Timer Migration System - Main Entry Point
 * Complete migration toolkit from localStorage to Supabase PostgreSQL
 * 
 * This is the main entry point for the migration system providing:
 * - Easy-to-use API for all migration operations
 * - Component coordination and workflow management
 * - Comprehensive documentation and examples
 * - Production-ready migration utilities
 */

// Core Migration Components
export { DataMigrationManager } from './DataMigrationManager'
export { LocalStorageExtractor } from './LocalStorageExtractor'
export { DataValidator } from './DataValidator'
export { RecoveryManager } from './RecoveryManager'
export { HybridUserManager } from './HybridUserManager'
export { MigrationOrchestrator } from './MigrationOrchestrator'
export { MigrationTestSuite } from './MigrationTestSuite'

// React Components
export { default as MigrationDashboard } from '../components/MigrationDashboard'
export { default as MigrationWizard } from '../components/MigrationWizard'

/**
 * Migration System Factory
 * Simplified API for creating and managing migration operations
 */
export class MigrationSystem {
  constructor(options = {}) {
    this.options = {
      strategy: 'safe', // 'safe', 'fast', 'hybrid'
      enableHybridMode: true,
      autoBackup: true,
      validateData: true,
      ...options
    }
    
    this.orchestrator = null
    this.initialized = false
  }

  // =====================================================================================
  // INITIALIZATION
  // =====================================================================================

  async initialize() {
    if (this.initialized) return

    const { MigrationOrchestrator } = await import('./MigrationOrchestrator')
    this.orchestrator = new MigrationOrchestrator(this.options)
    
    this.initialized = true
    return this.orchestrator
  }

  // =====================================================================================
  // HIGH-LEVEL API METHODS
  // =====================================================================================

  /**
   * Perform complete health check of the system
   */
  async healthCheck() {
    await this.initialize()
    return await this.orchestrator.performHealthCheck()
  }

  /**
   * Start data migration with specified strategy
   */
  async migrate(options = {}) {
    await this.initialize()
    return await this.orchestrator.startMigration(options)
  }

  /**
   * Rollback to previous state
   */
  async rollback(backupId = null, options = {}) {
    await this.initialize()
    return await this.orchestrator.rollbackMigration(backupId, options)
  }

  /**
   * Enable hybrid mode for gradual migration
   */
  async enableHybridMode() {
    await this.initialize()
    return await this.orchestrator.enableHybridMode()
  }

  /**
   * Get current system status
   */
  async getStatus() {
    if (!this.initialized) {
      return { initialized: false }
    }
    return this.orchestrator.getStatus()
  }

  /**
   * Run comprehensive test suite
   */
  async runTests(options = {}) {
    const { MigrationTestSuite } = await import('./MigrationTestSuite')
    const testSuite = new MigrationTestSuite()
    return await testSuite.runAllTests(options)
  }

  // =====================================================================================
  // EVENT HANDLING
  // =====================================================================================

  /**
   * Listen for migration events
   */
  on(event, callback) {
    if (this.orchestrator) {
      this.orchestrator.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.orchestrator) {
      this.orchestrator.off(event, callback)
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Export current localStorage data
   */
  async exportData() {
    const { LocalStorageExtractor } = await import('./LocalStorageExtractor')
    const extractor = new LocalStorageExtractor()
    return extractor.extractAllData()
  }

  /**
   * Validate exported data
   */
  async validateData(data) {
    const { DataValidator } = await import('./DataValidator')
    const validator = new DataValidator()
    return await validator.validateCompleteDataset(data)
  }

  /**
   * Create emergency backup
   */
  async createBackup() {
    const { RecoveryManager } = await import('./RecoveryManager')
    const recoveryManager = new RecoveryManager()
    return await recoveryManager.createFullBackup('localStorage')
  }

  /**
   * Clean up migration system
   */
  async cleanup() {
    if (this.orchestrator) {
      await this.orchestrator.cleanup()
      this.orchestrator = null
    }
    this.initialized = false
  }
}

/**
 * Quick Migration Functions
 * Simplified API for common operations
 */

/**
 * Quick health check
 */
export async function quickHealthCheck() {
  const system = new MigrationSystem()
  try {
    return await system.healthCheck()
  } finally {
    await system.cleanup()
  }
}

/**
 * Quick data export
 */
export async function quickExport() {
  const { LocalStorageExtractor } = await import('./LocalStorageExtractor')
  const extractor = new LocalStorageExtractor()
  return extractor.extractAllData()
}

/**
 * Quick data validation
 */
export async function quickValidate() {
  const { LocalStorageExtractor } = await import('./LocalStorageExtractor')
  const { DataValidator } = await import('./DataValidator')
  
  const extractor = new LocalStorageExtractor()
  const validator = new DataValidator()
  
  const data = extractor.extractAllData()
  return await validator.validateCompleteDataset(data)
}

/**
 * Quick backup creation
 */
export async function quickBackup() {
  const { RecoveryManager } = await import('./RecoveryManager')
  const recoveryManager = new RecoveryManager()
  return await recoveryManager.createFullBackup('localStorage')
}

/**
 * Safe migration with all safety checks
 */
export async function safeMigration(options = {}) {
  const system = new MigrationSystem({
    strategy: 'safe',
    enableHybridMode: true,
    autoBackup: true,
    validateData: true,
    ...options
  })
  
  try {
    // Perform health check first
    const healthCheck = await system.healthCheck()
    if (healthCheck.overall === 'critical') {
      throw new Error('System health check failed: ' + healthCheck.recommendations.map(r => r.message).join(', '))
    }

    // Start migration
    return await system.migrate(options)
  } finally {
    // Keep system running for hybrid mode if enabled
    if (!options.enableHybridMode === false) {
      // Don't cleanup to maintain hybrid functionality
    } else {
      await system.cleanup()
    }
  }
}

/**
 * Migration Utilities
 */
export const MigrationUtils = {
  /**
   * Check if migration is needed
   */
  async isMigrationNeeded() {
    try {
      const { LocalStorageExtractor } = await import('./LocalStorageExtractor')
      const extractor = new LocalStorageExtractor()
      const scanResults = extractor.scanLocalStorage()
      return scanResults.statistics.totalUsers > 0
    } catch (error) {
      return false
    }
  },

  /**
   * Get migration recommendations
   */
  async getRecommendations() {
    try {
      const data = await quickExport()
      const validation = await quickValidate()
      
      const recommendations = []

      if (validation.score < 60) {
        recommendations.push({
          type: 'critical',
          message: 'Data quality is low. Consider data cleanup before migration.',
          action: 'review_data'
        })
      } else if (validation.score < 80) {
        recommendations.push({
          type: 'warning',
          message: 'Some data issues detected. Review before migration.',
          action: 'validate_data'
        })
      }

      if (data.metadata.statistics.totalUsers > 100) {
        recommendations.push({
          type: 'info',
          message: 'Large dataset detected. Consider hybrid migration strategy.',
          action: 'use_hybrid_mode'
        })
      }

      if (navigator && !navigator.onLine) {
        recommendations.push({
          type: 'warning',
          message: 'No internet connection. Migration will be queued until connection is restored.',
          action: 'check_connection'
        })
      }

      return recommendations
    } catch (error) {
      return [{
        type: 'error',
        message: 'Failed to generate recommendations: ' + error.message,
        action: 'check_system'
      }]
    }
  },

  /**
   * Format migration results for display
   */
  formatResults(results) {
    return {
      success: results.success,
      strategy: results.strategy,
      summary: {
        steps: results.steps?.length || 0,
        completedSteps: results.steps?.filter(s => s.success).length || 0,
        errors: results.error ? [results.error] : results.steps?.filter(s => !s.success).map(s => s.error || 'Unknown error') || []
      },
      recommendations: this.generatePostMigrationRecommendations(results)
    }
  },

  generatePostMigrationRecommendations(results) {
    const recommendations = []

    if (results.success) {
      recommendations.push({
        type: 'success',
        message: 'Migration completed successfully!',
        action: 'start_using_cloud_version'
      })

      if (results.strategy === 'hybrid') {
        recommendations.push({
          type: 'info',
          message: 'Hybrid mode is now active. Your data will sync automatically.',
          action: 'monitor_sync_status'
        })
      }
    } else {
      recommendations.push({
        type: 'error',
        message: 'Migration failed. Your original data is safe in localStorage.',
        action: 'review_errors_and_retry'
      })

      if (results.error?.includes('validation')) {
        recommendations.push({
          type: 'warning',
          message: 'Consider running data validation and cleanup before retrying.',
          action: 'validate_and_cleanup'
        })
      }
    }

    return recommendations
  }
}

/**
 * Default Migration System Instance
 * For convenience, export a default instance
 */
export const defaultMigrationSystem = new MigrationSystem()

/**
 * Migration Constants
 */
export const MIGRATION_STRATEGIES = {
  SAFE: 'safe',
  FAST: 'fast', 
  HYBRID: 'hybrid'
}

export const MIGRATION_EVENTS = {
  HEALTH_CHECK_PROGRESS: 'healthCheckProgress',
  MIGRATION_PROGRESS: 'migrationProgress',
  MIGRATION_COMPLETE: 'migrationComplete',
  MIGRATION_ERROR: 'migrationError',
  ROLLBACK_COMPLETE: 'rollbackComplete',
  ROLLBACK_ERROR: 'rollbackError',
  HYBRID_MODE_ENABLED: 'hybridModeEnabled',
  HYBRID_MODE_DISABLED: 'hybridModeDisabled',
  OPERATION_START: 'operationStart',
  OPERATION_COMPLETE: 'operationComplete',
  OPERATION_ERROR: 'operationError'
}

/**
 * Version Information
 */
export const VERSION = '4.0.0'
export const BUILD_DATE = new Date().toISOString()

/**
 * Documentation Links
 */
export const DOCUMENTATION = {
  SETUP_GUIDE: '/database/supabase-setup.md',
  MIGRATION_GUIDE: 'Built into MigrationWizard component',
  TROUBLESHOOTING: 'Available via MigrationDashboard logs',
  API_REFERENCE: 'This file and component documentation'
}

/**
 * Example Usage:
 * 
 * ```javascript
 * import { MigrationSystem, safeMigration, quickHealthCheck } from './lib/migration'
 * 
 * // Quick health check
 * const health = await quickHealthCheck()
 * console.log('System health:', health.overall)
 * 
 * // Safe migration
 * const result = await safeMigration({ strategy: 'safe' })
 * console.log('Migration result:', result.success)
 * 
 * // Advanced usage
 * const system = new MigrationSystem({ strategy: 'hybrid' })
 * 
 * system.on('migrationProgress', (progress) => {
 *   console.log('Progress:', progress.step, progress.progress + '%')
 * })
 * 
 * const migrationResult = await system.migrate()
 * ```
 */