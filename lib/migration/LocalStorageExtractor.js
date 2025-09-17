/**
 * LocalStorage Data Extractor for Pomodoro Timer Migration
 * Browser-based utility for extracting and analyzing localStorage data
 * 
 * Features:
 * - Real-time data scanning and analysis
 * - Data structure mapping and validation
 * - Export formatting for migration
 * - Safety checks and data integrity verification
 */

export class LocalStorageExtractor {
  constructor() {
    this.isDebugMode = process.env.NODE_ENV === 'development'
    this.dataKeys = {
      users: 'registeredUsers',
      sessions: 'userSessions',
      currentUser: 'currentUser'
    }
  }

  // =====================================================================================
  // DATA SCANNING AND DISCOVERY
  // =====================================================================================

  scanLocalStorage() {
    this.log('Scanning localStorage for Pomodoro Timer data...')
    
    try {
      if (typeof window === 'undefined' || !localStorage) {
        throw new Error('localStorage not available')
      }

      const scanResult = {
        timestamp: new Date().toISOString(),
        totalKeys: localStorage.length,
        pomodoroKeys: [],
        userData: {
          registeredUsers: null,
          currentUser: null,
          userSpecificKeys: {}
        },
        statistics: {
          totalUsers: 0,
          totalSessions: 0,
          totalMeetings: 0,
          totalStats: 0,
          activeSessions: 0
        },
        health: {
          corruptedKeys: [],
          missingData: [],
          warnings: []
        }
      }

      // Scan all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (this.isPomodoroKey(key)) {
          scanResult.pomodoroKeys.push(key)
        }
      }

      // Analyze registered users
      const registeredUsers = this.safeGetItem('registeredUsers')
      if (registeredUsers) {
        scanResult.userData.registeredUsers = registeredUsers
        scanResult.statistics.totalUsers = Object.keys(registeredUsers).length
      } else {
        scanResult.health.missingData.push('registeredUsers')
      }

      // Get current user
      const currentUser = this.safeGetItem('currentUser')
      if (currentUser) {
        scanResult.userData.currentUser = currentUser
      }

      // Scan user-specific data
      if (registeredUsers) {
        for (const userId of Object.keys(registeredUsers)) {
          scanResult.userData.userSpecificKeys[userId] = this.scanUserData(userId)
          
          // Update statistics
          const userKeys = scanResult.userData.userSpecificKeys[userId]
          if (userKeys.sessions) {
            scanResult.statistics.totalSessions += userKeys.sessions.length
          }
          if (userKeys.meetings) {
            scanResult.statistics.totalMeetings += userKeys.meetings.length
          }
          if (userKeys.stats) {
            scanResult.statistics.totalStats++
          }
          if (userKeys.activeSession) {
            scanResult.statistics.activeSessions++
          }
        }
      }

      // Health checks
      this.performHealthChecks(scanResult)

      this.log(`Scan completed - Users: ${scanResult.statistics.totalUsers}, Sessions: ${scanResult.statistics.totalSessions}`)
      
      return scanResult
    } catch (error) {
      this.log(`Scan failed: ${error.message}`, 'error')
      throw error
    }
  }

  scanUserData(userId) {
    const userData = {
      userId: userId,
      sessions: null,
      stats: null,
      meetings: null,
      activeSession: null,
      keyHealth: {
        existing: [],
        missing: [],
        corrupted: []
      }
    }

    // Check each expected user key
    const expectedKeys = [
      `pomodoroSessions_${userId}`,
      `userStats_${userId}`,
      `meetings_${userId}`,
      `activePomodoroSession_${userId}`
    ]

    for (const key of expectedKeys) {
      const data = this.safeGetItem(key)
      if (data !== null) {
        userData.keyHealth.existing.push(key)
        
        // Store the actual data
        if (key.startsWith('pomodoroSessions_')) {
          userData.sessions = data
        } else if (key.startsWith('userStats_')) {
          userData.stats = data
        } else if (key.startsWith('meetings_')) {
          userData.meetings = data
        } else if (key.startsWith('activePomodoroSession_')) {
          userData.activeSession = data
        }
      } else {
        userData.keyHealth.missing.push(key)
      }
    }

    return userData
  }

  // =====================================================================================
  // DATA EXTRACTION AND FORMATTING
  // =====================================================================================

  extractAllData() {
    this.log('Extracting all Pomodoro Timer data...')
    
    try {
      const extractedData = {
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        source: 'localStorage',
        metadata: {
          extractionMethod: 'browser',
          browser: this.getBrowserInfo(),
          storageSize: this.calculateStorageSize()
        },
        users: {},
        sessions: {},
        stats: {},
        meetings: {},
        system: {
          currentUser: null,
          activeSessions: {},
          userSessions: null
        }
      }

      // Extract registered users
      const registeredUsers = this.safeGetItem('registeredUsers')
      if (registeredUsers) {
        extractedData.users = registeredUsers
      }

      // Extract current user
      const currentUser = this.safeGetItem('currentUser')
      if (currentUser) {
        extractedData.system.currentUser = currentUser
      }

      // Extract user sessions table (if exists)
      const userSessions = this.safeGetItem('userSessions')
      if (userSessions) {
        extractedData.system.userSessions = userSessions
      }

      // Extract all user-specific data
      for (const userId of Object.keys(extractedData.users)) {
        this.extractUserSpecificData(userId, extractedData)
      }

      // Calculate final statistics
      extractedData.metadata.statistics = this.calculateExtractionStatistics(extractedData)

      this.log(`Extraction completed - ${JSON.stringify(extractedData.metadata.statistics)}`)
      
      return extractedData
    } catch (error) {
      this.log(`Extraction failed: ${error.message}`, 'error')
      throw error
    }
  }

  extractUserSpecificData(userId, extractedData) {
    try {
      // Extract pomodoro sessions
      const sessions = this.safeGetItem(`pomodoroSessions_${userId}`)
      if (sessions) {
        extractedData.sessions[userId] = sessions
      }

      // Extract user statistics
      const stats = this.safeGetItem(`userStats_${userId}`)
      if (stats) {
        extractedData.stats[userId] = stats
      }

      // Extract meetings
      const meetings = this.safeGetItem(`meetings_${userId}`)
      if (meetings) {
        extractedData.meetings[userId] = meetings
      }

      // Extract active session
      const activeSession = this.safeGetItem(`activePomodoroSession_${userId}`)
      if (activeSession) {
        extractedData.system.activeSessions[userId] = activeSession
      }

    } catch (error) {
      this.log(`Failed to extract data for user ${userId}: ${error.message}`, 'error')
    }
  }

  // =====================================================================================
  // DATA ANALYSIS AND HEALTH CHECKS
  // =====================================================================================

  performHealthChecks(scanResult) {
    // Check for data consistency
    if (scanResult.userData.registeredUsers) {
      const userIds = Object.keys(scanResult.userData.registeredUsers)
      
      for (const userId of userIds) {
        const userData = scanResult.userData.userSpecificKeys[userId]
        
        // Check if user has basic data structure
        if (!userData || userData.keyHealth.missing.length === userData.keyHealth.missing.length) {
          scanResult.health.warnings.push(`User ${userId} has no data keys`)
        }
        
        // Check for corrupted user data
        if (scanResult.userData.registeredUsers[userId]) {
          const user = scanResult.userData.registeredUsers[userId]
          if (!user.email || !user.id) {
            scanResult.health.warnings.push(`User ${userId} has incomplete profile data`)
          }
        }
      }
    }

    // Check for orphaned data
    const allKeys = scanResult.pomodoroKeys
    const userIds = scanResult.userData.registeredUsers ? Object.keys(scanResult.userData.registeredUsers) : []
    
    for (const key of allKeys) {
      if (key.includes('_')) {
        const userId = key.split('_')[1]
        if (userId && !userIds.includes(userId)) {
          scanResult.health.warnings.push(`Orphaned data key: ${key}`)
        }
      }
    }
  }

  analyzeDataStructure(data) {
    this.log('Analyzing data structure...')
    
    const analysis = {
      timestamp: new Date().toISOString(),
      overview: {
        totalSize: JSON.stringify(data).length,
        totalUsers: Object.keys(data.users || {}).length,
        dataIntegrity: 'good'
      },
      userAnalysis: {},
      recommendations: [],
      issues: []
    }

    // Analyze each user's data
    for (const [userId, userData] of Object.entries(data.users || {})) {
      analysis.userAnalysis[userId] = this.analyzeUserData(userId, userData, data)
    }

    // Generate recommendations
    this.generateRecommendations(analysis, data)

    this.log(`Analysis completed - Issues: ${analysis.issues.length}, Recommendations: ${analysis.recommendations.length}`)
    
    return analysis
  }

  analyzeUserData(userId, userData, fullData) {
    const userAnalysis = {
      profile: {
        isComplete: true,
        missingFields: []
      },
      sessions: {
        count: 0,
        hasData: false,
        dateRange: null
      },
      stats: {
        hasData: false,
        isConsistent: true
      },
      meetings: {
        count: 0,
        hasData: false
      }
    }

    // Analyze profile completeness
    const requiredFields = ['id', 'email', 'displayName']
    for (const field of requiredFields) {
      if (!userData[field]) {
        userAnalysis.profile.missingFields.push(field)
        userAnalysis.profile.isComplete = false
      }
    }

    // Analyze sessions data
    const sessions = fullData.sessions?.[userId]
    if (sessions && Array.isArray(sessions)) {
      userAnalysis.sessions.hasData = true
      userAnalysis.sessions.count = sessions.length
      
      if (sessions.length > 0) {
        const dates = sessions
          .map(s => s.startTime || s.createdAt)
          .filter(Boolean)
          .map(d => new Date(d))
          .sort()
        
        if (dates.length > 0) {
          userAnalysis.sessions.dateRange = {
            start: dates[0].toISOString(),
            end: dates[dates.length - 1].toISOString()
          }
        }
      }
    }

    // Analyze stats data
    const stats = fullData.stats?.[userId]
    if (stats) {
      userAnalysis.stats.hasData = true
      
      // Check consistency between stats and actual sessions
      if (sessions && stats.totalSessions !== sessions.length) {
        userAnalysis.stats.isConsistent = false
      }
    }

    // Analyze meetings data
    const meetings = fullData.meetings?.[userId]
    if (meetings && Array.isArray(meetings)) {
      userAnalysis.meetings.hasData = true
      userAnalysis.meetings.count = meetings.length
    }

    return userAnalysis
  }

  generateRecommendations(analysis, data) {
    // Check overall data size
    if (analysis.overview.totalSize > 5 * 1024 * 1024) { // 5MB
      analysis.recommendations.push({
        type: 'performance',
        message: 'Large dataset detected. Consider batch migration to avoid browser memory issues.',
        priority: 'medium'
      })
    }

    // Check for users with incomplete data
    let incompleteUsers = 0
    for (const [userId, userAnalysis] of Object.entries(analysis.userAnalysis)) {
      if (!userAnalysis.profile.isComplete) {
        incompleteUsers++
        analysis.issues.push({
          type: 'data_integrity',
          message: `User ${userId} has incomplete profile: ${userAnalysis.profile.missingFields.join(', ')}`,
          severity: 'warning'
        })
      }
      
      if (!userAnalysis.stats.isConsistent) {
        analysis.issues.push({
          type: 'data_consistency',
          message: `User ${userId} has inconsistent statistics`,
          severity: 'warning'
        })
      }
    }

    if (incompleteUsers > 0) {
      analysis.recommendations.push({
        type: 'data_quality',
        message: `${incompleteUsers} users have incomplete data. Review before migration.`,
        priority: 'high'
      })
    }

    // Check for migration readiness
    if (analysis.issues.filter(i => i.severity === 'error').length === 0) {
      analysis.recommendations.push({
        type: 'migration',
        message: 'Data structure is ready for migration',
        priority: 'info'
      })
    }
  }

  // =====================================================================================
  // EXPORT UTILITIES
  // =====================================================================================

  exportToFile(data, filename = null) {
    try {
      if (typeof window === 'undefined' || !document) {
        throw new Error('File export not available in this environment')
      }

      const exportData = {
        ...data,
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: '4.0.0',
          browser: this.getBrowserInfo(),
          source: 'LocalStorageExtractor'
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const defaultFilename = `pomodoro-export-${new Date().toISOString().split('T')[0]}.json`
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename || defaultFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      this.log(`Data exported to file: ${filename || defaultFilename}`)
      
      return { success: true, filename: filename || defaultFilename, size: dataStr.length }
    } catch (error) {
      this.log(`Export failed: ${error.message}`, 'error')
      throw error
    }
  }

  exportToClipboard(data) {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }

      const exportData = JSON.stringify(data, null, 2)
      
      return navigator.clipboard.writeText(exportData).then(() => {
        this.log('Data exported to clipboard')
        return { success: true, size: exportData.length }
      })
    } catch (error) {
      this.log(`Clipboard export failed: ${error.message}`, 'error')
      throw error
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  isPomodoroKey(key) {
    const pomodoroKeyPatterns = [
      'registeredUsers',
      'currentUser',
      'userSessions',
      /^pomodoroSessions_/,
      /^userStats_/,
      /^meetings_/,
      /^activePomodoroSession_/
    ]

    return pomodoroKeyPatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return key === pattern
      } else {
        return pattern.test(key)
      }
    })
  }

  safeGetItem(key) {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return null
      
      // Try to parse as JSON
      try {
        return JSON.parse(item)
      } catch (parseError) {
        // Return as string if not valid JSON
        return item
      }
    } catch (error) {
      this.log(`Failed to get item ${key}: ${error.message}`, 'warn')
      return null
    }
  }

  calculateStorageSize() {
    try {
      let totalSize = 0
      let pomodoroSize = 0
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const value = localStorage.getItem(key) || ''
        const itemSize = key.length + value.length
        
        totalSize += itemSize
        
        if (this.isPomodoroKey(key)) {
          pomodoroSize += itemSize
        }
      }
      
      return {
        totalSize,
        pomodoroSize,
        otherSize: totalSize - pomodoroSize,
        totalSizeKB: Math.round(totalSize / 1024),
        pomodoroSizeKB: Math.round(pomodoroSize / 1024)
      }
    } catch (error) {
      this.log(`Failed to calculate storage size: ${error.message}`, 'warn')
      return { totalSize: 0, pomodoroSize: 0 }
    }
  }

  calculateExtractionStatistics(data) {
    return {
      totalUsers: Object.keys(data.users).length,
      totalSessions: Object.values(data.sessions).reduce((sum, sessions) => sum + (sessions?.length || 0), 0),
      totalMeetings: Object.values(data.meetings).reduce((sum, meetings) => sum + (meetings?.length || 0), 0),
      activeSessionsCount: Object.keys(data.system.activeSessions).length,
      dataSize: JSON.stringify(data).length,
      extractionTime: new Date().toISOString()
    }
  }

  getBrowserInfo() {
    try {
      if (typeof navigator === 'undefined') return 'Unknown'
      
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    } catch (error) {
      return 'Unknown'
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [EXTRACTOR] ${message}`
    
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

export default LocalStorageExtractor