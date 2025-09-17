/**
 * Data Validation and Integrity Checker for Pomodoro Timer Migration
 * Comprehensive validation system ensuring data accuracy and consistency
 * 
 * Features:
 * - Multi-level validation (schema, business rules, referential integrity)
 * - Performance-optimized batch validation
 * - Detailed error reporting and remediation suggestions
 * - Pre and post-migration validation
 * - Data quality scoring and recommendations
 */

export class DataValidator {
  constructor() {
    this.isDebugMode = process.env.NODE_ENV === 'development'
    this.validationRules = this.initializeValidationRules()
    this.businessRules = this.initializeBusinessRules()
    this.schemaDefinitions = this.initializeSchemaDefinitions()
  }

  // =====================================================================================
  // VALIDATION RULE DEFINITIONS
  // =====================================================================================

  initializeValidationRules() {
    return {
      user: {
        required: ['id', 'email'],
        optional: ['displayName', 'password', 'createdAt', 'lastLogin', 'preferences'],
        constraints: {
          id: { type: 'string', minLength: 1, maxLength: 50 },
          email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
          displayName: { type: 'string', maxLength: 100 },
          password: { type: 'string', minLength: 4 },
          createdAt: { type: 'string', format: 'iso8601' },
          lastLogin: { type: 'string', format: 'iso8601', allowNull: true }
        }
      },
      session: {
        required: ['id', 'duration', 'startTime'],
        optional: ['title', 'goal', 'tags', 'location', 'endTime', 'status', 'completedAt', 'stoppedAt', 'user', 'createdAt'],
        constraints: {
          id: { type: 'string', minLength: 1 },
          title: { type: 'string', maxLength: 255 },
          duration: { type: 'number', min: 1, max: 240 },
          startTime: { type: 'string', format: 'iso8601' },
          endTime: { type: 'string', format: 'iso8601' },
          status: { type: 'string', enum: ['scheduled', 'active', 'completed', 'stopped', 'paused'] },
          tags: { type: 'string', maxLength: 500 },
          location: { type: 'string', maxLength: 100 }
        }
      },
      meeting: {
        required: ['title', 'date', 'time'],
        optional: ['id', 'description', 'location', 'duration', 'status', 'agenda', 'notes', 'createdAt', 'updatedAt'],
        constraints: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          date: { type: 'string', format: 'date' },
          time: { type: 'string', format: 'time' },
          duration: { type: 'number', min: 1, max: 1440 },
          status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'] }
        }
      },
      stats: {
        required: ['userId'],
        optional: ['totalSessions', 'completedSessions', 'totalMinutes', 'completedMinutes', 
                  'streakDays', 'longestStreak', 'lastSessionDate', 'weeklyGoal', 
                  'monthlyStats', 'dailyStats', 'tags', 'locations', 'completionRate', 'averageSessionLength'],
        constraints: {
          userId: { type: 'string', minLength: 1 },
          totalSessions: { type: 'number', min: 0 },
          completedSessions: { type: 'number', min: 0 },
          totalMinutes: { type: 'number', min: 0 },
          completedMinutes: { type: 'number', min: 0 },
          streakDays: { type: 'number', min: 0 },
          longestStreak: { type: 'number', min: 0 },
          weeklyGoal: { type: 'number', min: 0 },
          completionRate: { type: 'number', min: 0, max: 100 },
          averageSessionLength: { type: 'number', min: 0 }
        }
      }
    }
  }

  initializeBusinessRules() {
    return {
      user: [
        {
          name: 'unique_email',
          validate: (user, allUsers) => {
            const emails = Object.values(allUsers).map(u => u.email)
            return emails.filter(email => email === user.email).length === 1
          },
          message: 'Email must be unique across all users'
        },
        {
          name: 'unique_id',
          validate: (user, allUsers) => {
            return Object.keys(allUsers).filter(id => id === user.id).length === 1
          },
          message: 'User ID must be unique'
        }
      ],
      session: [
        {
          name: 'valid_time_range',
          validate: (session) => {
            if (!session.startTime || !session.endTime) return true // Optional fields
            return new Date(session.endTime) > new Date(session.startTime)
          },
          message: 'End time must be after start time'
        },
        {
          name: 'consistent_completion',
          validate: (session) => {
            if (session.status === 'completed' && !session.completedAt) return false
            if (session.status === 'stopped' && !session.stoppedAt) return false
            return true
          },
          message: 'Session status must be consistent with completion timestamps'
        }
      ],
      meeting: [
        {
          name: 'future_or_recent_date',
          validate: (meeting) => {
            const meetingDate = new Date(meeting.date)
            const cutoffDate = new Date()
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 2) // Allow meetings up to 2 years old
            return meetingDate >= cutoffDate
          },
          message: 'Meeting date should not be more than 2 years in the past'
        }
      ],
      stats: [
        {
          name: 'logical_counters',
          validate: (stats) => {
            return stats.completedSessions <= stats.totalSessions &&
                   stats.completedMinutes <= stats.totalMinutes
          },
          message: 'Completed values cannot exceed total values'
        },
        {
          name: 'streak_consistency',
          validate: (stats) => {
            return stats.longestStreak >= stats.streakDays
          },
          message: 'Longest streak must be greater than or equal to current streak'
        }
      ]
    }
  }

  initializeSchemaDefinitions() {
    return {
      localStorage: {
        requiredKeys: ['registeredUsers'],
        optionalKeys: ['currentUser', 'userSessions'],
        userKeys: {
          pattern: /^(pomodoroSessions_|userStats_|meetings_|activePomodoroSession_)/,
          types: {
            pomodoroSessions: 'array',
            userStats: 'object',
            meetings: 'array',
            activePomodoroSession: 'object'
          }
        }
      },
      export: {
        requiredFields: ['timestamp', 'version', 'users', 'sessions', 'stats', 'meetings'],
        structure: {
          users: 'object',
          sessions: 'object',
          stats: 'object',
          meetings: 'object',
          metadata: 'object'
        }
      }
    }
  }

  // =====================================================================================
  // COMPREHENSIVE DATA VALIDATION
  // =====================================================================================

  async validateCompleteDataset(data, options = {}) {
    this.log('Starting comprehensive data validation...')
    
    const {
      skipBusinessRules = false,
      skipIntegrityChecks = false,
      maxErrors = 1000,
      batchSize = 100
    } = options

    const validation = {
      timestamp: new Date().toISOString(),
      isValid: true,
      score: 100,
      summary: {
        totalUsers: 0,
        totalSessions: 0,
        totalMeetings: 0,
        validUsers: 0,
        validSessions: 0,
        validMeetings: 0
      },
      results: {
        structure: null,
        users: [],
        sessions: [],
        meetings: [],
        statistics: [],
        businessRules: [],
        integrity: []
      },
      errors: [],
      warnings: [],
      recommendations: [],
      performance: {
        validationTime: null,
        processingRate: null
      }
    }

    const startTime = Date.now()

    try {
      // Step 1: Validate overall structure
      validation.results.structure = this.validateDataStructure(data)
      if (!validation.results.structure.isValid) {
        validation.isValid = false
        validation.errors.push(...validation.results.structure.errors)
      }

      // Step 2: Validate users
      if (data.users) {
        validation.summary.totalUsers = Object.keys(data.users).length
        validation.results.users = await this.validateUsers(data.users, { batchSize, maxErrors })
        validation.summary.validUsers = validation.results.users.filter(r => r.isValid).length
        
        if (validation.results.users.some(r => !r.isValid)) {
          validation.isValid = false
        }
      }

      // Step 3: Validate sessions
      if (data.sessions) {
        const allSessions = Object.values(data.sessions).flat()
        validation.summary.totalSessions = allSessions.length
        validation.results.sessions = await this.validateSessions(allSessions, { batchSize, maxErrors })
        validation.summary.validSessions = validation.results.sessions.filter(r => r.isValid).length
      }

      // Step 4: Validate meetings
      if (data.meetings) {
        const allMeetings = Object.values(data.meetings).flat()
        validation.summary.totalMeetings = allMeetings.length
        validation.results.meetings = await this.validateMeetings(allMeetings, { batchSize, maxErrors })
        validation.summary.validMeetings = validation.results.meetings.filter(r => r.isValid).length
      }

      // Step 5: Validate statistics
      if (data.stats) {
        validation.results.statistics = await this.validateStatistics(data.stats, { batchSize, maxErrors })
      }

      // Step 6: Business rule validation
      if (!skipBusinessRules) {
        validation.results.businessRules = await this.validateBusinessRules(data)
        if (validation.results.businessRules.some(r => r.severity === 'error')) {
          validation.isValid = false
        }
      }

      // Step 7: Referential integrity checks
      if (!skipIntegrityChecks) {
        validation.results.integrity = await this.validateReferentialIntegrity(data)
        if (validation.results.integrity.some(r => r.severity === 'error')) {
          validation.isValid = false
        }
      }

      // Calculate validation score and generate recommendations
      validation.score = this.calculateValidationScore(validation)
      validation.recommendations = this.generateValidationRecommendations(validation)

      // Performance metrics
      const endTime = Date.now()
      validation.performance.validationTime = endTime - startTime
      validation.performance.processingRate = Math.round(
        (validation.summary.totalUsers + validation.summary.totalSessions + validation.summary.totalMeetings) /
        (validation.performance.validationTime / 1000)
      )

      this.log(`Validation completed - Score: ${validation.score}%, Valid: ${validation.isValid}, Time: ${validation.performance.validationTime}ms`)
      
      return validation
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error')
      validation.isValid = false
      validation.errors.push(`Validation process failed: ${error.message}`)
      return validation
    }
  }

  // =====================================================================================
  // SPECIFIC VALIDATION METHODS
  // =====================================================================================

  validateDataStructure(data) {
    this.log('Validating data structure...')
    
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Check if data is an object
      if (!data || typeof data !== 'object') {
        result.errors.push('Data must be a valid object')
        result.isValid = false
        return result
      }

      // Check required fields
      const schema = this.schemaDefinitions.export
      for (const field of schema.requiredFields) {
        if (!(field in data)) {
          result.errors.push(`Missing required field: ${field}`)
          result.isValid = false
        }
      }

      // Check field types
      for (const [field, expectedType] of Object.entries(schema.structure)) {
        if (field in data) {
          const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field]
          if (actualType !== expectedType) {
            result.errors.push(`Field ${field} should be ${expectedType}, got ${actualType}`)
            result.isValid = false
          }
        }
      }

      // Check version compatibility
      if (data.version && !this.isVersionCompatible(data.version)) {
        result.warnings.push(`Version ${data.version} may not be fully compatible`)
      }

      this.log(`Structure validation completed - Valid: ${result.isValid}`)
      
      return result
    } catch (error) {
      result.isValid = false
      result.errors.push(`Structure validation failed: ${error.message}`)
      return result
    }
  }

  async validateUsers(users, options = {}) {
    this.log(`Validating ${Object.keys(users).length} users...`)
    
    const { batchSize = 100, maxErrors = 1000 } = options
    const results = []
    const userEntries = Object.entries(users)

    for (let i = 0; i < userEntries.length; i += batchSize) {
      const batch = userEntries.slice(i, i + batchSize)
      
      for (const [userId, userData] of batch) {
        const userResult = this.validateSingleUser(userId, userData, users)
        results.push(userResult)
        
        if (results.filter(r => !r.isValid).length >= maxErrors) {
          this.log(`Maximum error limit (${maxErrors}) reached for user validation`, 'warn')
          break
        }
      }
    }

    this.log(`User validation completed - ${results.filter(r => r.isValid).length}/${results.length} valid`)
    
    return results
  }

  validateSingleUser(userId, userData, allUsers = {}) {
    const result = {
      userId: userId,
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Schema validation
      const schemaValidation = this.validateAgainstSchema(userData, this.validationRules.user)
      if (!schemaValidation.isValid) {
        result.isValid = false
        result.errors.push(...schemaValidation.errors)
      }
      result.warnings.push(...schemaValidation.warnings)

      // Business rule validation
      for (const rule of this.businessRules.user) {
        try {
          if (!rule.validate(userData, allUsers)) {
            result.errors.push(`Business rule violation (${rule.name}): ${rule.message}`)
            result.isValid = false
          }
        } catch (ruleError) {
          result.warnings.push(`Business rule ${rule.name} failed to execute: ${ruleError.message}`)
        }
      }

      // Additional user-specific checks
      if (userData.preferences) {
        const prefsValidation = this.validateUserPreferences(userData.preferences)
        if (!prefsValidation.isValid) {
          result.warnings.push(...prefsValidation.warnings)
        }
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`User validation failed: ${error.message}`)
    }

    return result
  }

  async validateSessions(sessions, options = {}) {
    this.log(`Validating ${sessions.length} sessions...`)
    
    const { batchSize = 100, maxErrors = 1000 } = options
    const results = []

    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize)
      
      for (const session of batch) {
        const sessionResult = this.validateSingleSession(session)
        results.push(sessionResult)
        
        if (results.filter(r => !r.isValid).length >= maxErrors) {
          this.log(`Maximum error limit (${maxErrors}) reached for session validation`, 'warn')
          break
        }
      }
    }

    this.log(`Session validation completed - ${results.filter(r => r.isValid).length}/${results.length} valid`)
    
    return results
  }

  validateSingleSession(session) {
    const result = {
      sessionId: session.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Schema validation
      const schemaValidation = this.validateAgainstSchema(session, this.validationRules.session)
      if (!schemaValidation.isValid) {
        result.isValid = false
        result.errors.push(...schemaValidation.errors)
      }
      result.warnings.push(...schemaValidation.warnings)

      // Business rule validation
      for (const rule of this.businessRules.session) {
        try {
          if (!rule.validate(session)) {
            result.errors.push(`Business rule violation (${rule.name}): ${rule.message}`)
            result.isValid = false
          }
        } catch (ruleError) {
          result.warnings.push(`Business rule ${rule.name} failed to execute: ${ruleError.message}`)
        }
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Session validation failed: ${error.message}`)
    }

    return result
  }

  async validateMeetings(meetings, options = {}) {
    this.log(`Validating ${meetings.length} meetings...`)
    
    const results = []
    
    for (const meeting of meetings) {
      const meetingResult = this.validateSingleMeeting(meeting)
      results.push(meetingResult)
    }

    this.log(`Meeting validation completed - ${results.filter(r => r.isValid).length}/${results.length} valid`)
    
    return results
  }

  validateSingleMeeting(meeting) {
    const result = {
      meetingId: meeting.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Schema validation
      const schemaValidation = this.validateAgainstSchema(meeting, this.validationRules.meeting)
      if (!schemaValidation.isValid) {
        result.isValid = false
        result.errors.push(...schemaValidation.errors)
      }
      result.warnings.push(...schemaValidation.warnings)

      // Business rule validation
      for (const rule of this.businessRules.meeting) {
        try {
          if (!rule.validate(meeting)) {
            result.errors.push(`Business rule violation (${rule.name}): ${rule.message}`)
            result.isValid = false
          }
        } catch (ruleError) {
          result.warnings.push(`Business rule ${rule.name} failed to execute: ${ruleError.message}`)
        }
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Meeting validation failed: ${error.message}`)
    }

    return result
  }

  // =====================================================================================
  // REFERENTIAL INTEGRITY VALIDATION
  // =====================================================================================

  async validateReferentialIntegrity(data) {
    this.log('Validating referential integrity...')
    
    const results = []

    try {
      // Check if all session users exist
      if (data.sessions && data.users) {
        for (const [userId, userSessions] of Object.entries(data.sessions)) {
          if (!data.users[userId]) {
            results.push({
              type: 'orphaned_sessions',
              severity: 'error',
              message: `Sessions exist for non-existent user: ${userId}`,
              count: userSessions.length
            })
          }
        }
      }

      // Check if all stats users exist
      if (data.stats && data.users) {
        for (const [userId, userStats] of Object.entries(data.stats)) {
          if (!data.users[userId]) {
            results.push({
              type: 'orphaned_stats',
              severity: 'error',
              message: `Statistics exist for non-existent user: ${userId}`,
              details: userStats
            })
          }
        }
      }

      // Check if all meeting users exist
      if (data.meetings && data.users) {
        for (const [userId, userMeetings] of Object.entries(data.meetings)) {
          if (!data.users[userId]) {
            results.push({
              type: 'orphaned_meetings',
              severity: 'error',
              message: `Meetings exist for non-existent user: ${userId}`,
              count: userMeetings.length
            })
          }
        }
      }

      // Check consistency between stats and actual sessions
      if (data.stats && data.sessions) {
        for (const [userId, userStats] of Object.entries(data.stats)) {
          const userSessions = data.sessions[userId] || []
          
          if (userStats.totalSessions !== userSessions.length) {
            results.push({
              type: 'inconsistent_session_count',
              severity: 'warning',
              message: `User ${userId}: Stats show ${userStats.totalSessions} sessions, but ${userSessions.length} sessions found`,
              expected: userStats.totalSessions,
              actual: userSessions.length
            })
          }
        }
      }

      this.log(`Integrity validation completed - ${results.length} issues found`)
      
      return results
    } catch (error) {
      return [{
        type: 'integrity_check_failed',
        severity: 'error',
        message: `Integrity validation failed: ${error.message}`
      }]
    }
  }

  // =====================================================================================
  // UTILITY VALIDATION METHODS
  // =====================================================================================

  validateAgainstSchema(data, schema) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Check required fields
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        result.errors.push(`Missing required field: ${field}`)
        result.isValid = false
      }
    }

    // Check field constraints
    for (const [field, value] of Object.entries(data)) {
      const constraint = schema.constraints[field]
      if (!constraint) continue

      const fieldValidation = this.validateFieldConstraint(field, value, constraint)
      if (!fieldValidation.isValid) {
        result.isValid = false
        result.errors.push(...fieldValidation.errors)
      }
      result.warnings.push(...fieldValidation.warnings)
    }

    return result
  }

  validateFieldConstraint(field, value, constraint) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // Null check
    if (value === null || value === undefined) {
      if (constraint.allowNull) {
        return result
      } else {
        result.errors.push(`Field ${field} cannot be null`)
        result.isValid = false
        return result
      }
    }

    // Type check
    if (constraint.type && typeof value !== constraint.type) {
      result.errors.push(`Field ${field} must be of type ${constraint.type}, got ${typeof value}`)
      result.isValid = false
    }

    // String constraints
    if (constraint.type === 'string' && typeof value === 'string') {
      if (constraint.minLength && value.length < constraint.minLength) {
        result.errors.push(`Field ${field} must be at least ${constraint.minLength} characters`)
        result.isValid = false
      }
      
      if (constraint.maxLength && value.length > constraint.maxLength) {
        result.errors.push(`Field ${field} must be no more than ${constraint.maxLength} characters`)
        result.isValid = false
      }
      
      if (constraint.pattern && !constraint.pattern.test(value)) {
        result.errors.push(`Field ${field} does not match required pattern`)
        result.isValid = false
      }
    }

    // Number constraints
    if (constraint.type === 'number' && typeof value === 'number') {
      if (constraint.min !== undefined && value < constraint.min) {
        result.errors.push(`Field ${field} must be at least ${constraint.min}`)
        result.isValid = false
      }
      
      if (constraint.max !== undefined && value > constraint.max) {
        result.errors.push(`Field ${field} must be no more than ${constraint.max}`)
        result.isValid = false
      }
    }

    // Enum constraints
    if (constraint.enum && !constraint.enum.includes(value)) {
      result.errors.push(`Field ${field} must be one of: ${constraint.enum.join(', ')}`)
      result.isValid = false
    }

    // Format constraints
    if (constraint.format) {
      const formatValidation = this.validateFormat(value, constraint.format)
      if (!formatValidation.isValid) {
        result.errors.push(`Field ${field} has invalid ${constraint.format} format`)
        result.isValid = false
      }
    }

    return result
  }

  validateFormat(value, format) {
    const result = { isValid: true, errors: [] }

    switch (format) {
      case 'iso8601':
        try {
          const date = new Date(value)
          if (isNaN(date.getTime()) || date.toISOString() !== value) {
            result.isValid = false
          }
        } catch {
          result.isValid = false
        }
        break
      
      case 'date':
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value)) {
          result.isValid = false
        }
        break
      
      case 'time':
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(value)) {
          result.isValid = false
        }
        break
    }

    return result
  }

  // =====================================================================================
  // SCORING AND RECOMMENDATIONS
  // =====================================================================================

  calculateValidationScore(validation) {
    let score = 100
    
    // Deduct points for structural issues
    if (!validation.results.structure.isValid) {
      score -= 30
    }

    // Deduct points for invalid records
    const totalRecords = validation.summary.totalUsers + validation.summary.totalSessions + validation.summary.totalMeetings
    const validRecords = validation.summary.validUsers + validation.summary.validSessions + validation.summary.validMeetings
    
    if (totalRecords > 0) {
      const validityPercentage = (validRecords / totalRecords) * 100
      score = Math.min(score, validityPercentage)
    }

    // Deduct points for integrity issues
    const errorIntegrityIssues = validation.results.integrity.filter(i => i.severity === 'error').length
    score -= errorIntegrityIssues * 5

    return Math.max(0, Math.round(score))
  }

  generateValidationRecommendations(validation) {
    const recommendations = []

    // Score-based recommendations
    if (validation.score < 50) {
      recommendations.push({
        priority: 'critical',
        category: 'data_quality',
        message: 'Data quality is critically low. Consider data cleanup before migration.',
        action: 'Review and fix validation errors before proceeding'
      })
    } else if (validation.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        message: 'Data quality needs improvement for optimal migration.',
        action: 'Address major validation issues to improve data quality'
      })
    }

    // Structural recommendations
    if (!validation.results.structure.isValid) {
      recommendations.push({
        priority: 'critical',
        category: 'structure',
        message: 'Data structure issues must be resolved before migration.',
        action: 'Fix structural problems identified in validation'
      })
    }

    // Performance recommendations
    if (validation.performance.processingRate < 100) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        message: 'Consider batch processing for large datasets.',
        action: 'Use smaller batch sizes or implement progressive migration'
      })
    }

    return recommendations
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  validateUserPreferences(preferences) {
    const result = { isValid: true, warnings: [] }

    if (preferences.defaultPomodoroLength && (preferences.defaultPomodoroLength < 1 || preferences.defaultPomodoroLength > 120)) {
      result.warnings.push('Default pomodoro length should be between 1-120 minutes')
    }

    if (preferences.weeklyGoal && preferences.weeklyGoal < 0) {
      result.warnings.push('Weekly goal should not be negative')
    }

    return result
  }

  isVersionCompatible(version) {
    const compatibleVersions = ['4.0.0', '3.9.9', '3.9.8']
    return compatibleVersions.includes(version)
  }

  async validateBusinessRules(data) {
    // Implementation would go here for cross-entity business rules
    return []
  }

  async validateStatistics(stats, options = {}) {
    const results = []
    
    for (const [userId, userStats] of Object.entries(stats)) {
      const statsResult = {
        userId: userId,
        isValid: true,
        errors: [],
        warnings: []
      }

      const schemaValidation = this.validateAgainstSchema(userStats, this.validationRules.stats)
      if (!schemaValidation.isValid) {
        statsResult.isValid = false
        statsResult.errors.push(...schemaValidation.errors)
      }

      results.push(statsResult)
    }

    return results
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [VALIDATOR] ${message}`
    
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

export default DataValidator