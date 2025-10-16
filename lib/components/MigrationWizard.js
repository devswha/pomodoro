/**
 * Migration Wizard Component
 * Step-by-step guided migration interface with safety checks
 * 
 * Features:
 * - Guided migration process with detailed explanations
 * - Pre-migration health checks and recommendations
 * - Safety confirmations for destructive operations
 * - Progress tracking with rollback options
 * - User-friendly error handling and recovery guidance
 */

import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { LocalStorageExtractor } from '../migration/LocalStorageExtractor'
import { DataValidator } from '../migration/DataValidator'

const WizardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #ffffff;
  border: 2px solid #000;
  min-height: 600px;
`

const WizardHeader = styled.div`
  text-align: center;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: bold;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .step-indicator {
    color: #6c757d;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`

const StepContent = styled.div`
  padding: 2rem 1rem;
  min-height: 400px;
`

const StepTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const StepDescription = styled.p`
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.6;
`

const HealthCheckResults = styled.div`
  border: 2px solid ${props => props.status === 'error' ? '#dc3545' : props.status === 'warning' ? '#ffc107' : '#000'};
  padding: 1rem;
  margin: 1rem 0;
  
  .health-header {
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .health-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .health-item {
    text-align: center;
    
    .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #000;
    }
    
    .label {
      color: #6c757d;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
`

const ValidationResults = styled.div`
  margin: 1rem 0;
  
  .validation-score {
    text-align: center;
    padding: 1rem;
    border: 2px solid #000;
    margin-bottom: 1rem;
    
    .score {
      font-size: 3rem;
      font-weight: bold;
      color: ${props => props.score >= 80 ? '#000' : props.score >= 60 ? '#ffc107' : '#dc3545'};
    }
    
    .score-label {
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.5rem;
    }
  }
  
  .validation-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .validation-column {
    h4 {
      font-weight: bold;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .issue-list {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        padding: 0.25rem 0;
        color: #6c757d;
        font-size: 0.875rem;
        
        &.error {
          color: #dc3545;
        }
        
        &.warning {
          color: #ffc107;
        }
      }
    }
  }
`

const SafetyCheckbox = styled.label`
  display: block;
  margin: 1rem 0;
  padding: 1rem;
  border: 2px solid #e9ecef;
  cursor: pointer;
  
  &:hover {
    border-color: #000;
  }
  
  input {
    margin-right: 0.75rem;
  }
  
  .checkbox-text {
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .checkbox-description {
    color: #6c757d;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 2px solid #000;
  padding-top: 1rem;
  margin-top: 2rem;
`

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: 2px solid #000;
  background-color: ${props => props.variant === 'primary' ? '#000' : '#fff'};
  color: ${props => props.variant === 'primary' ? '#fff' : '#000'};
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

const WarningBox = styled.div`
  border: 2px solid #dc3545;
  background-color: #fff5f5;
  padding: 1rem;
  margin: 1rem 0;
  
  .warning-header {
    font-weight: bold;
    color: #dc3545;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .warning-text {
    color: #721c24;
    line-height: 1.6;
  }
`

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e9ecef;
    border-top: 4px solid #000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const MigrationWizard = ({ migrationManager, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [healthCheckResults, setHealthCheckResults] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [exportData, setExportData] = useState(null)
  const [safetyChecks, setSafetyChecks] = useState({
    understoodConsequences: false,
    hasBackup: false,
    confirmMigration: false
  })

  const extractor = new LocalStorageExtractor()
  const validator = new DataValidator()

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Data Migration',
      component: WelcomeStep
    },
    {
      id: 'health_check',
      title: 'Data Health Check',
      component: HealthCheckStep
    },
    {
      id: 'validation',
      title: 'Data Validation',
      component: ValidationStep
    },
    {
      id: 'safety_confirmation',
      title: 'Safety Confirmation',
      component: SafetyConfirmationStep
    },
    {
      id: 'migration',
      title: 'Running Migration',
      component: MigrationStep
    },
    {
      id: 'completion',
      title: 'Migration Complete',
      component: CompletionStep
    }
  ]

  const runHealthCheck = async () => {
    setIsLoading(true)
    try {
      const scanResults = extractor.scanLocalStorage()
      setHealthCheckResults(scanResults)
      
      if (scanResults.statistics.totalUsers > 0) {
        const extractedData = extractor.extractAllData()
        setExportData(extractedData)
      }
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runValidation = async () => {
    if (!exportData) return

    setIsLoading(true)
    try {
      const validation = await validator.validateCompleteDataset(exportData)
      setValidationResults(validation)
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runMigration = async () => {
    setIsLoading(true)
    try {
      const result = await migrationManager.startMigration({
        skipBackup: false,
        dryRun: false,
        batchSize: 10
      })
      
      onComplete?.(result)
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true
      case 'health_check':
        return healthCheckResults && healthCheckResults.statistics.totalUsers > 0
      case 'validation':
        return validationResults && validationResults.isValid
      case 'safety_confirmation':
        return Object.values(safetyChecks).every(check => check)
      default:
        return true
    }
  }

  // Step Components
  function WelcomeStep() {
    return (
      <StepContent>
        <StepTitle>Welcome to Data Migration</StepTitle>
        <StepDescription>
          This wizard will guide you through migrating your STEP Timer data from localStorage to Supabase. 
          We'll perform health checks, validate your data, and ensure a safe migration process.
        </StepDescription>
        
        <div style={{ padding: '1rem', border: '2px solid #000', margin: '2rem 0' }}>
          <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            What will be migrated:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '2rem' }}>
            <li>User accounts and profiles</li>
            <li>Pomodoro session history</li>
            <li>User statistics and analytics</li>
            <li>Meeting schedules</li>
            <li>User preferences and settings</li>
          </ul>
        </div>
        
        <div style={{ padding: '1rem', border: '2px solid #ffc107', margin: '2rem 0' }}>
          <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Before you begin:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '2rem' }}>
            <li>Ensure you have a stable internet connection</li>
            <li>Do not close this browser tab during migration</li>
            <li>We recommend creating a backup of your browser data</li>
          </ul>
        </div>
      </StepContent>
    )
  }

  function HealthCheckStep() {
    useEffect(() => {
      if (!healthCheckResults) {
        runHealthCheck()
      }
    }, [])

    if (isLoading && !healthCheckResults) {
      return (
        <StepContent>
          <LoadingSpinner>
            <div className="spinner" />
            <div>Scanning localStorage for STEP Timer data...</div>
          </LoadingSpinner>
        </StepContent>
      )
    }

    return (
      <StepContent>
        <StepTitle>Data Health Check</StepTitle>
        <StepDescription>
          We've scanned your localStorage for STEP Timer data. Here's what we found:
        </StepDescription>

        {healthCheckResults && (
          <HealthCheckResults status={
            healthCheckResults.health.corruptedKeys.length > 0 ? 'error' :
            healthCheckResults.health.warnings.length > 0 ? 'warning' : 'good'
          }>
            <div className="health-header">Data Summary</div>
            <div className="health-summary">
              <div className="health-item">
                <div className="value">{healthCheckResults.statistics.totalUsers}</div>
                <div className="label">Users</div>
              </div>
              <div className="health-item">
                <div className="value">{healthCheckResults.statistics.totalSessions}</div>
                <div className="label">Sessions</div>
              </div>
              <div className="health-item">
                <div className="value">{healthCheckResults.statistics.totalMeetings}</div>
                <div className="label">Meetings</div>
              </div>
              <div className="health-item">
                <div className="value">{healthCheckResults.pomodoroKeys.length}</div>
                <div className="label">Data Keys</div>
              </div>
            </div>
            
            {healthCheckResults.health.warnings.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div className="health-header">Warnings:</div>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '2rem' }}>
                  {healthCheckResults.health.warnings.map((warning, index) => (
                    <li key={index} style={{ color: '#856404' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </HealthCheckResults>
        )}

        {healthCheckResults?.statistics.totalUsers === 0 && (
          <WarningBox>
            <div className="warning-header">No Data Found</div>
            <div className="warning-text">
              We couldn't find any STEP Timer data in your localStorage. 
              Please make sure you're running this migration on the same browser 
              and device where you've been using the application.
            </div>
          </WarningBox>
        )}
      </StepContent>
    )
  }

  function ValidationStep() {
    useEffect(() => {
      if (exportData && !validationResults) {
        runValidation()
      }
    }, [exportData])

    if (isLoading && !validationResults) {
      return (
        <StepContent>
          <LoadingSpinner>
            <div className="spinner" />
            <div>Validating data structure and integrity...</div>
          </LoadingSpinner>
        </StepContent>
      )
    }

    return (
      <StepContent>
        <StepTitle>Data Validation</StepTitle>
        <StepDescription>
          We've analyzed your data for quality, structure, and integrity issues.
        </StepDescription>

        {validationResults && (
          <ValidationResults score={validationResults.score}>
            <div className="validation-score">
              <div className="score">{validationResults.score}%</div>
              <div className="score-label">Data Quality Score</div>
            </div>
            
            <div className="validation-details">
              <div className="validation-column">
                <h4>Summary</h4>
                <ul className="issue-list">
                  <li>Valid Users: {validationResults.summary.validUsers}/{validationResults.summary.totalUsers}</li>
                  <li>Valid Sessions: {validationResults.summary.validSessions}/{validationResults.summary.totalSessions}</li>
                  <li>Valid Meetings: {validationResults.summary.validMeetings}/{validationResults.summary.totalMeetings}</li>
                </ul>
              </div>
              
              <div className="validation-column">
                <h4>Issues Found</h4>
                <ul className="issue-list">
                  {validationResults.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="error">• {error}</li>
                  ))}
                  {validationResults.warnings.slice(0, 5).map((warning, index) => (
                    <li key={index} className="warning">• {warning}</li>
                  ))}
                  {validationResults.errors.length + validationResults.warnings.length === 0 && (
                    <li>No issues found!</li>
                  )}
                </ul>
              </div>
            </div>
          </ValidationResults>
        )}

        {validationResults && !validationResults.isValid && (
          <WarningBox>
            <div className="warning-header">Data Quality Issues</div>
            <div className="warning-text">
              Some issues were found with your data. While migration can still proceed, 
              some data might not be transferred correctly. Please review the issues above.
            </div>
          </WarningBox>
        )}
      </StepContent>
    )
  }

  function SafetyConfirmationStep() {
    return (
      <StepContent>
        <StepTitle>Safety Confirmation</StepTitle>
        <StepDescription>
          Please read and confirm the following before proceeding with the migration:
        </StepDescription>

        <SafetyCheckbox>
          <input
            type="checkbox"
            checked={safetyChecks.understoodConsequences}
            onChange={(e) => setSafetyChecks(prev => ({
              ...prev,
              understoodConsequences: e.target.checked
            }))}
          />
          <div className="checkbox-text">I understand this is a one-way migration</div>
          <div className="checkbox-description">
            Once migrated, your data will be stored in Supabase. You should not continue 
            using the localStorage version to avoid data conflicts.
          </div>
        </SafetyCheckbox>

        <SafetyCheckbox>
          <input
            type="checkbox"
            checked={safetyChecks.hasBackup}
            onChange={(e) => setSafetyChecks(prev => ({
              ...prev,
              hasBackup: e.target.checked
            }))}
          />
          <div className="checkbox-text">I have a backup of my data</div>
          <div className="checkbox-description">
            A backup file will be automatically created, but it's recommended to have 
            your own backup of your browser data as an additional safety measure.
          </div>
        </SafetyCheckbox>

        <SafetyCheckbox>
          <input
            type="checkbox"
            checked={safetyChecks.confirmMigration}
            onChange={(e) => setSafetyChecks(prev => ({
              ...prev,
              confirmMigration: e.target.checked
            }))}
          />
          <div className="checkbox-text">I'm ready to proceed with the migration</div>
          <div className="checkbox-description">
            This will start the migration process. Please ensure you have a stable 
            internet connection and do not close this browser tab.
          </div>
        </SafetyCheckbox>
      </StepContent>
    )
  }

  function MigrationStep() {
    useEffect(() => {
      if (!isLoading) {
        runMigration()
      }
    }, [])

    return (
      <StepContent>
        <LoadingSpinner>
          <div className="spinner" />
          <div>Migration in progress...</div>
          <div style={{ marginTop: '1rem', color: '#6c757d' }}>
            This may take several minutes depending on the amount of data.
            Please do not close this browser tab.
          </div>
        </LoadingSpinner>
      </StepContent>
    )
  }

  function CompletionStep() {
    return (
      <StepContent>
        <StepTitle>Migration Complete!</StepTitle>
        <StepDescription>
          Your data has been successfully migrated to Supabase. You can now start using 
          the cloud-based version of the STEP Timer.
        </StepDescription>

        <div style={{ textAlign: 'center', padding: '2rem', border: '2px solid #000', margin: '2rem 0' }}>
          <div style={{ fontSize: '4rem', color: '#000', marginBottom: '1rem' }}>✓</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Migration Successful
          </div>
        </div>

        <div style={{ padding: '1rem', border: '2px solid #000', margin: '2rem 0' }}>
          <h3 style={{ margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Next Steps:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '2rem' }}>
            <li>Your backup file has been downloaded for safety</li>
            <li>Your data is now stored securely in Supabase</li>
            <li>You can continue using the application normally</li>
            <li>The old localStorage data is still available as a backup</li>
          </ul>
        </div>
      </StepContent>
    )
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <WizardContainer>
      <WizardHeader>
        <h1>Data Migration Wizard</h1>
        <div className="step-indicator">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </div>
      </WizardHeader>

      <CurrentStepComponent />

      <ButtonContainer>
        <Button onClick={onCancel || (() => {})}>
          Cancel
        </Button>
        
        <div>
          {currentStep > 0 && (
            <Button onClick={prevStep} style={{ marginRight: '1rem' }}>
              Previous
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button 
              variant="primary" 
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? 'Processing...' : 'Next'}
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={() => onComplete?.()}
            >
              Finish
            </Button>
          )}
        </div>
      </ButtonContainer>
    </WizardContainer>
  )
}

export default MigrationWizard