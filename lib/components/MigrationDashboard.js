/**
 * Migration Progress Dashboard Component
 * Real-time migration monitoring and control interface
 * 
 * Features:
 * - Live progress tracking with visual indicators
 * - Step-by-step migration status display
 * - Error reporting and remediation suggestions
 * - Migration controls (start, pause, rollback)
 * - Data statistics and validation results
 */

import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'

// Styled Components
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`

const Header = styled.div`
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: bold;
    color: #000;
    margin: 0 0 0.5rem 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  
  .subtitle {
    color: #6c757d;
    font-size: 1rem;
  }
`

const ProgressSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h2 {
      font-size: 1.25rem;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
`

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background-color: #f8f9fa;
  border: 2px solid #000;
  margin: 1rem 0;
  position: relative;
  
  .progress-fill {
    height: 100%;
    background-color: ${props => props.status === 'error' ? '#dc3545' : '#000'};
    transition: width 0.3s ease;
    width: ${props => props.progress}%;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    color: ${props => props.progress > 50 ? '#fff' : '#000'};
    font-size: 0.875rem;
  }
`

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`

const StepCard = styled.div`
  border: 2px solid ${props => {
    if (props.status === 'completed') return '#000'
    if (props.status === 'in_progress') return '#000'
    if (props.status === 'error') return '#dc3545'
    return '#e9ecef'
  }};
  padding: 1rem;
  background-color: ${props => {
    if (props.status === 'completed') return '#f8f9fa'
    if (props.status === 'in_progress') return '#fff'
    return '#fff'
  }};
  
  .step-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    
    .step-icon {
      width: 24px;
      height: 24px;
      border: 2px solid #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
      font-weight: bold;
      background-color: ${props => {
        if (props.status === 'completed') return '#000'
        if (props.status === 'in_progress') return '#fff'
        if (props.status === 'error') return '#dc3545'
        return '#fff'
      }};
      color: ${props => {
        if (props.status === 'completed') return '#fff'
        if (props.status === 'error') return '#fff'
        return '#000'
      }};
    }
    
    .step-title {
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  .step-description {
    color: #6c757d;
    font-size: 0.875rem;
    margin-left: 32px;
  }
`

const StatisticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`

const StatCard = styled.div`
  border: 2px solid #e9ecef;
  padding: 1rem;
  text-align: center;
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #000;
  }
  
  .stat-label {
    color: #6c757d;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }
`

const ControlsSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 2px solid #e9ecef;
`

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid #000;
  background-color: ${props => {
    if (props.variant === 'primary') return '#000'
    if (props.variant === 'danger') return '#dc3545'
    return '#fff'
  }};
  color: ${props => {
    if (props.variant === 'primary') return '#fff'
    if (props.variant === 'danger') return '#fff'
    return '#000'
  }};
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const LogSection = styled.div`
  margin-top: 2rem;
  border: 2px solid #e9ecef;
  
  .log-header {
    padding: 1rem;
    border-bottom: 2px solid #e9ecef;
    background-color: #f8f9fa;
    
    h3 {
      margin: 0;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
  
  .log-content {
    max-height: 300px;
    overflow-y: auto;
    padding: 1rem;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    background-color: #000;
    color: #00ff00;
  }
  
  .log-entry {
    margin-bottom: 0.25rem;
    
    &.error {
      color: #ff4444;
    }
    
    &.warning {
      color: #ffff00;
    }
    
    &.success {
      color: #44ff44;
    }
  }
`

const MigrationDashboard = ({ 
  migrationManager, 
  onMigrationComplete, 
  onMigrationError 
}) => {
  const [migrationStatus, setMigrationStatus] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [validationResults, setValidationResults] = useState(null)

  const migrationSteps = [
    {
      id: 'export_data',
      title: 'Export Data',
      description: 'Extract all data from localStorage',
      icon: '1'
    },
    {
      id: 'validate_export',
      title: 'Validate Export',
      description: 'Check data integrity and structure',
      icon: '2'
    },
    {
      id: 'create_backup',
      title: 'Create Backup',
      description: 'Generate safety backup of original data',
      icon: '3'
    },
    {
      id: 'migrate_users',
      title: 'Migrate Users',
      description: 'Transfer user accounts to Supabase',
      icon: '4'
    },
    {
      id: 'migrate_preferences',
      title: 'Migrate Preferences',
      description: 'Transfer user preferences',
      icon: '5'
    },
    {
      id: 'migrate_stats',
      title: 'Migrate Statistics',
      description: 'Transfer user statistics and analytics',
      icon: '6'
    },
    {
      id: 'migrate_sessions',
      title: 'Migrate Sessions',
      description: 'Transfer pomodoro session history',
      icon: '7'
    },
    {
      id: 'migrate_meetings',
      title: 'Migrate Meetings',
      description: 'Transfer meeting schedules',
      icon: '8'
    },
    {
      id: 'validate_migration',
      title: 'Validate Migration',
      description: 'Verify all data was migrated correctly',
      icon: '9'
    },
    {
      id: 'cleanup',
      title: 'Cleanup',
      description: 'Finalize migration and optimize database',
      icon: '10'
    }
  ]

  // Initialize component
  useEffect(() => {
    loadMigrationStatus()
    setupEventListeners()
  }, [])

  const loadMigrationStatus = useCallback(() => {
    if (migrationManager) {
      const status = migrationManager.getMigrationStatus()
      setMigrationStatus(status)
      setIsRunning(status?.isStarted && !status?.isCompleted)
    }
  }, [migrationManager])

  const setupEventListeners = useCallback(() => {
    const handleProgress = (event) => {
      setMigrationStatus(event.detail)
      addLog(`Progress: ${event.detail.currentStep} - ${event.detail.progress}%`, 'info')
    }

    const handleLog = (event) => {
      addLog(event.detail.message, event.detail.level)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('migrationProgress', handleProgress)
      window.addEventListener('migrationLog', handleLog)
      
      return () => {
        window.removeEventListener('migrationProgress', handleProgress)
        window.removeEventListener('migrationLog', handleLog)
      }
    }
  }, [])

  const addLog = useCallback((message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev.slice(-99), { // Keep last 100 logs
      timestamp,
      message,
      level,
      id: Date.now() + Math.random()
    }])
  }, [])

  const startMigration = async () => {
    if (!migrationManager || isRunning) return

    try {
      setIsRunning(true)
      addLog('Starting migration process...', 'info')
      
      const result = await migrationManager.startMigration({
        skipBackup: false,
        dryRun: false,
        batchSize: 10
      })
      
      setStatistics(result.exportData?.metadata?.statistics)
      setValidationResults(result.validation)
      
      addLog('Migration completed successfully!', 'success')
      onMigrationComplete?.(result)
      
    } catch (error) {
      addLog(`Migration failed: ${error.message}`, 'error')
      onMigrationError?.(error)
    } finally {
      setIsRunning(false)
    }
  }

  const performDryRun = async () => {
    if (!migrationManager || isRunning) return

    try {
      setIsRunning(true)
      addLog('Starting dry run...', 'info')
      
      const result = await migrationManager.startMigration({
        skipBackup: true,
        dryRun: true,
        batchSize: 10
      })
      
      setStatistics(result.exportData?.metadata?.statistics)
      setValidationResults(result.validation)
      
      addLog('Dry run completed successfully!', 'success')
      
    } catch (error) {
      addLog(`Dry run failed: ${error.message}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const rollbackMigration = async () => {
    if (!migrationManager || isRunning) return

    try {
      setIsRunning(true)
      addLog('Starting rollback...', 'warning')
      
      const result = await migrationManager.rollbackMigration()
      
      addLog('Rollback completed successfully!', 'success')
      loadMigrationStatus()
      
    } catch (error) {
      addLog(`Rollback failed: ${error.message}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  const clearMigrationData = () => {
    if (migrationManager) {
      migrationManager.clearMigrationData()
      setMigrationStatus(null)
      setStatistics(null)
      setValidationResults(null)
      setLogs([])
      addLog('Migration data cleared', 'info')
    }
  }

  const getStepStatus = (stepId) => {
    if (!migrationStatus) return 'pending'
    
    if (migrationStatus.completedSteps?.includes(stepId)) return 'completed'
    if (migrationStatus.currentStep === stepId) return 'in_progress'
    if (migrationStatus.errors?.some(e => e.step === stepId)) return 'error'
    
    return 'pending'
  }

  const getStepIcon = (stepId, status) => {
    if (status === 'completed') return '✓'
    if (status === 'in_progress') return '...'
    if (status === 'error') return '✗'
    
    const step = migrationSteps.find(s => s.id === stepId)
    return step?.icon || '?'
  }

  return (
    <DashboardContainer>
      <Header>
        <h1>Data Migration Dashboard</h1>
        <div className="subtitle">
          Migrate your Pomodoro Timer data from localStorage to Supabase
        </div>
      </Header>

      <ProgressSection>
        <div className="progress-header">
          <h2>Migration Progress</h2>
          <div>
            {migrationStatus?.isStarted ? 
              (migrationStatus?.isCompleted ? 'Completed' : 'Running') : 
              'Not Started'
            }
          </div>
        </div>
        
        <ProgressBar 
          progress={migrationStatus?.progress || 0}
          status={migrationStatus?.errors?.length > 0 ? 'error' : 'normal'}
        >
          <div className="progress-fill" />
          <div className="progress-text">
            {migrationStatus?.progress || 0}%
          </div>
        </ProgressBar>

        <StepsGrid>
          {migrationSteps.map(step => {
            const status = getStepStatus(step.id)
            return (
              <StepCard key={step.id} status={status}>
                <div className="step-header">
                  <div className="step-icon">
                    {getStepIcon(step.id, status)}
                  </div>
                  <div className="step-title">{step.title}</div>
                </div>
                <div className="step-description">{step.description}</div>
              </StepCard>
            )
          })}
        </StepsGrid>
      </ProgressSection>

      {(statistics || validationResults) && (
        <ProgressSection>
          <div className="progress-header">
            <h2>Data Statistics</h2>
          </div>
          
          <StatisticsGrid>
            {statistics && (
              <>
                <StatCard>
                  <div className="stat-value">{statistics.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                </StatCard>
                <StatCard>
                  <div className="stat-value">{statistics.totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </StatCard>
                <StatCard>
                  <div className="stat-value">{statistics.totalMeetings}</div>
                  <div className="stat-label">Total Meetings</div>
                </StatCard>
                <StatCard>
                  <div className="stat-value">{Math.round(statistics.dataSize / 1024)}KB</div>
                  <div className="stat-label">Data Size</div>
                </StatCard>
              </>
            )}
            
            {validationResults && (
              <>
                <StatCard>
                  <div className="stat-value">{validationResults.score || 0}%</div>
                  <div className="stat-label">Data Quality</div>
                </StatCard>
                <StatCard>
                  <div className="stat-value">{validationResults.errors?.length || 0}</div>
                  <div className="stat-label">Errors</div>
                </StatCard>
                <StatCard>
                  <div className="stat-value">{validationResults.warnings?.length || 0}</div>
                  <div className="stat-label">Warnings</div>
                </StatCard>
                <StatCard>
                  <div className="stat-value">
                    {validationResults.isValid ? '✓' : '✗'}
                  </div>
                  <div className="stat-label">Validation</div>
                </StatCard>
              </>
            )}
          </StatisticsGrid>
        </ProgressSection>
      )}

      <ControlsSection>
        <Button
          variant="primary"
          onClick={startMigration}
          disabled={isRunning || migrationStatus?.isCompleted}
        >
          {migrationStatus?.isCompleted ? 'Migration Complete' : 'Start Migration'}
        </Button>
        
        <Button
          onClick={performDryRun}
          disabled={isRunning}
        >
          Dry Run
        </Button>
        
        <Button
          variant="danger"
          onClick={rollbackMigration}
          disabled={isRunning || !migrationStatus?.isStarted}
        >
          Rollback
        </Button>
        
        <Button
          onClick={clearMigrationData}
          disabled={isRunning}
        >
          Clear Data
        </Button>
      </ControlsSection>

      <LogSection>
        <div className="log-header">
          <h3>Migration Logs</h3>
        </div>
        <div className="log-content">
          {logs.length === 0 ? (
            <div>No logs yet...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className={`log-entry ${log.level}`}>
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
        </div>
      </LogSection>
    </DashboardContainer>
  )
}

export default MigrationDashboard