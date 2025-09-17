'use client';

/**
 * RealtimeTimer - Real-time synchronized Pomodoro timer
 * Handles session timing with multi-device sync and collaborative features
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { usePresence } from '../hooks/usePresence';
import { useNotifications } from '../hooks/useNotifications';

// Animations
const timerPulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
`;

const progressFill = keyframes`
  from { width: 0%; }
  to { width: var(--progress); }
`;

const warningBlink = keyframes`
  0%, 50% { background-color: #ffffff; color: #000000; }
  51%, 100% { background-color: #dc3545; color: #ffffff; }
`;

// Styled Components
const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  border: 2px solid #000000;
  background-color: #ffffff;
  position: relative;
  
  ${props => props.isRunning && `
    animation: ${timerPulse} 2s infinite;
  `}
  
  ${props => props.isWarning && `
    animation: ${warningBlink} 1s infinite;
  `}
`;

const SessionInfo = styled.div`
  text-align: center;
  margin-bottom: 20px;
  
  .title {
    font-size: 24px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  
  .goal {
    font-size: 16px;
    color: #6c757d;
    margin-bottom: 4px;
  }
  
  .metadata {
    font-size: 14px;
    color: #adb5bd;
  }
`;

const TimerDisplay = styled.div`
  font-size: 96px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  text-align: center;
  margin: 30px 0;
  user-select: none;
  
  ${props => props.isLowTime && `
    color: #dc3545;
  `}
  
  @media (max-width: 768px) {
    font-size: 64px;
  }
  
  @media (max-width: 480px) {
    font-size: 48px;
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 20px 0;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 12px;
  border: 2px solid #000000;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #000000;
  width: ${props => props.progress}%;
  transition: width 0.5s ease;
  position: relative;
  
  ${props => props.isLowTime && `
    background-color: #dc3545;
  `}
`;

const ProgressText = styled.div`
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
`;

const StatusIndicators = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
`;

const StatusBadge = styled.div`
  padding: 4px 8px;
  border: 1px solid #6c757d;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
  
  ${props => props.active && `
    border-color: #000000;
    background-color: #000000;
    color: #ffffff;
  `}
`;

const MultiDeviceSync = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6c757d;
  
  .sync-icon {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props => 
      props.syncStatus === 'synced' ? '#28a745' :
      props.syncStatus === 'syncing' ? '#ffc107' : '#dc3545'
    };
  }
`;

const CollaborativeInfo = styled.div`
  margin: 15px 0;
  padding: 10px;
  border: 1px solid #e9ecef;
  background-color: #f8f9fa;
  font-size: 14px;
  
  .viewers {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .viewer-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #28a745;
  }
  
  .shared-info {
    font-size: 12px;
    color: #6c757d;
  }
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ControlButton = styled.button`
  padding: 12px 24px;
  border: 2px solid #000000;
  background-color: #ffffff;
  color: #000000;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background-color: #000000;
    color: #ffffff;
  }
  
  &:disabled {
    border-color: #6c757d;
    color: #6c757d;
    cursor: not-allowed;
    
    &:hover {
      background-color: #ffffff;
      color: #6c757d;
    }
  }
  
  ${props => props.primary && `
    background-color: #000000;
    color: #ffffff;
    
    &:hover:not(:disabled) {
      background-color: #ffffff;
      color: #000000;
    }
  `}
  
  ${props => props.danger && `
    border-color: #dc3545;
    color: #dc3545;
    
    &:hover:not(:disabled) {
      background-color: #dc3545;
      color: #ffffff;
    }
  `}
`;

const SessionCreator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 400px;
  
  input, select {
    padding: 12px;
    border: 2px solid #6c757d;
    font-size: 16px;
    background-color: #ffffff;
    
    &:focus {
      border-color: #000000;
      outline: none;
    }
  }
  
  .session-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
`;

export const RealtimeTimer = ({ showCreator = false }) => {
  const {
    session,
    timeRemaining,
    progress,
    isRunning,
    isPaused,
    createSession,
    pauseSession,
    resumeSession,
    completeSession,
    stopSession,
    conflicts,
    isConnected,
  } = useRealtimeSession();

  const {
    setActivity,
    getUsersInSameActivity,
  } = usePresence();

  const {
    sessionCompleteNotification,
    breakTimeNotification,
    scheduleNotification,
  } = useNotifications();

  const [sessionForm, setSessionForm] = useState({
    title: '',
    goal: '',
    duration: 25,
    tags: '',
    shared: false,
  });

  const [viewingUsers, setViewingUsers] = useState([]);
  const [lastWarningTime, setLastWarningTime] = useState(0);

  // Check for users watching the same session
  useEffect(() => {
    if (session) {
      const watchers = getUsersInSameActivity('in_session');
      setViewingUsers(watchers);
    }
  }, [session, getUsersInSameActivity]);

  // Handle session completion
  useEffect(() => {
    if (session && timeRemaining <= 0 && isRunning) {
      handleSessionComplete();
    }
  }, [timeRemaining, isRunning, session]);

  // Low time warnings
  useEffect(() => {
    if (session && isRunning && timeRemaining <= 300 && timeRemaining > 0) { // 5 minutes
      const now = Date.now();
      if (now - lastWarningTime > 60000) { // Only warn once per minute
        const minutesLeft = Math.ceil(timeRemaining / 60);
        scheduleNotification(
          Date.now() + 1000,
          `${minutesLeft} minutes remaining`,
          {
            body: `Your "${session.title}" session will end soon`,
            tag: 'time-warning',
          }
        );
        setLastWarningTime(now);
      }
    }
  }, [timeRemaining, isRunning, session, scheduleNotification, lastWarningTime]);

  const handleSessionComplete = useCallback(async () => {
    if (!session) return;

    await completeSession();
    await setActivity('completed_session', { sessionId: session.id });
    await sessionCompleteNotification(session);
    
    // Schedule break reminder
    setTimeout(() => {
      breakTimeNotification(5);
    }, 2000);
  }, [session, completeSession, setActivity, sessionCompleteNotification, breakTimeNotification]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    try {
      const newSession = await createSession(sessionForm);
      await setActivity('in_session', { sessionId: newSession.id });
      
      // Reset form
      setSessionForm({
        title: '',
        goal: '',
        duration: 25,
        tags: '',
        shared: false,
      });
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handlePause = async () => {
    await pauseSession();
    await setActivity('paused_session');
  };

  const handleResume = async () => {
    await resumeSession();
    await setActivity('in_session');
  };

  const handleStop = async () => {
    await stopSession();
    await setActivity('stopped_session');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSyncStatus = () => {
    if (conflicts.length > 0) return 'conflict';
    if (isConnected) return 'synced';
    return 'offline';
  };

  const isLowTime = timeRemaining <= 300; // 5 minutes or less
  const isWarning = timeRemaining <= 60 && isRunning; // 1 minute or less

  if (showCreator && !session) {
    return (
      <TimerContainer>
        <h2 style={{ marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Create New Session
        </h2>
        <SessionCreator>
          <form onSubmit={handleCreateSession}>
            <input
              type="text"
              placeholder="Session title (e.g., Deep Work, Study)"
              value={sessionForm.title}
              onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            
            <input
              type="text"
              placeholder="Goal or description"
              value={sessionForm.goal}
              onChange={(e) => setSessionForm(prev => ({ ...prev, goal: e.target.value }))}
            />
            
            <div className="session-options">
              <select
                value={sessionForm.duration}
                onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              >
                <option value={15}>15 minutes</option>
                <option value={25}>25 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={sessionForm.tags}
                onChange={(e) => setSessionForm(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={sessionForm.shared}
                onChange={(e) => setSessionForm(prev => ({ ...prev, shared: e.target.checked }))}
              />
              Share with study buddies
            </label>
            
            <ControlButton type="submit" primary>
              Start Session
            </ControlButton>
          </form>
        </SessionCreator>
      </TimerContainer>
    );
  }

  if (!session) {
    return (
      <TimerContainer>
        <h2 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#6c757d' }}>
          No Active Session
        </h2>
        <p style={{ color: '#6c757d', textAlign: 'center', margin: '20px 0' }}>
          Start a new Pomodoro session to begin focusing.
        </p>
      </TimerContainer>
    );
  }

  return (
    <TimerContainer isRunning={isRunning} isWarning={isWarning}>
      <MultiDeviceSync syncStatus={getSyncStatus()}>
        <div className="sync-icon"></div>
        <span>
          {getSyncStatus() === 'synced' && 'Synced'}
          {getSyncStatus() === 'syncing' && 'Syncing...'}
          {getSyncStatus() === 'conflict' && 'Conflict'}
          {getSyncStatus() === 'offline' && 'Offline'}
        </span>
      </MultiDeviceSync>

      <SessionInfo>
        <div className="title">{session.title}</div>
        {session.goal && <div className="goal">{session.goal}</div>}
        <div className="metadata">
          {session.duration}min session
          {session.tags && ` • ${session.tags}`}
          {session.shared && ' • Shared'}
        </div>
      </SessionInfo>

      <TimerDisplay isLowTime={isLowTime}>
        {formatTime(timeRemaining)}
      </TimerDisplay>

      <ProgressContainer>
        <ProgressTrack>
          <ProgressFill progress={progress} isLowTime={isLowTime} />
        </ProgressTrack>
        <ProgressText>
          {Math.round(progress)}% Complete
        </ProgressText>
      </ProgressContainer>

      <StatusIndicators>
        <StatusBadge active={isRunning}>Running</StatusBadge>
        <StatusBadge active={isPaused}>Paused</StatusBadge>
        <StatusBadge active={session.shared}>Shared</StatusBadge>
        <StatusBadge active={isConnected}>Connected</StatusBadge>
      </StatusIndicators>

      {session.shared && viewingUsers.length > 0 && (
        <CollaborativeInfo>
          <div className="viewers">
            <span>Also focusing:</span>
            {viewingUsers.slice(0, 3).map((user, index) => (
              <div key={index}>
                <div className="viewer-dot"></div>
                <span>{user.username}</span>
              </div>
            ))}
            {viewingUsers.length > 3 && (
              <span>+{viewingUsers.length - 3} more</span>
            )}
          </div>
          <div className="shared-info">
            Shared session - others can see your progress
          </div>
        </CollaborativeInfo>
      )}

      {conflicts.length > 0 && (
        <div style={{ 
          margin: '15px 0', 
          padding: '10px', 
          border: '2px solid #ffc107', 
          backgroundColor: '#fff3cd',
          textAlign: 'center',
        }}>
          <strong>⚠️ Sync Conflict</strong><br/>
          This session was modified on another device.
        </div>
      )}

      <ControlButtons>
        {!isRunning && !isPaused && (
          <ControlButton onClick={handleResume} primary>
            Start
          </ControlButton>
        )}
        
        {isRunning && (
          <ControlButton onClick={handlePause}>
            Pause
          </ControlButton>
        )}
        
        {isPaused && (
          <ControlButton onClick={handleResume} primary>
            Resume
          </ControlButton>
        )}
        
        <ControlButton onClick={handleSessionComplete} disabled={!isRunning && !isPaused}>
          Complete
        </ControlButton>
        
        <ControlButton onClick={handleStop} danger>
          Stop
        </ControlButton>
      </ControlButtons>
    </TimerContainer>
  );
};

export default RealtimeTimer;