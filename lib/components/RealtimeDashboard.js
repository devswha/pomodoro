'use client';

/**
 * RealtimeDashboard - Enhanced dashboard with real-time features
 * Shows live stats, presence indicators, collaborative features, and notifications
 */

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRealtime } from '../contexts/RealtimeContext';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { useRealtimeStats } from '../hooks/useRealtimeStats';
import { usePresence } from '../hooks/usePresence';
import { useNotifications } from '../hooks/useNotifications';
import { useOfflineSync } from '../hooks/useOfflineSync';

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const connectionPulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

// Styled Components
const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  min-height: 100vh;
  padding: 20px;
  background-color: #ffffff;
  color: #000000;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 10px;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  border: 2px solid #e9ecef;
  background-color: #f8f9fa;

  @media (max-width: 768px) {
    order: -1;
    padding: 15px;
  }
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px solid ${props => 
    props.status === 'connected' ? '#28a745' : 
    props.status === 'connecting' ? '#ffc107' : '#dc3545'
  };
  background-color: ${props => 
    props.status === 'connected' ? '#d4edda' : 
    props.status === 'connecting' ? '#fff3cd' : '#f8d7da'
  };
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => 
    props.status === 'connected' ? '#28a745' : 
    props.status === 'connecting' ? '#ffc107' : '#dc3545'
  };
  animation: ${props => props.status === 'connecting' ? connectionPulse : 'none'} 1.5s infinite;
`;

const SessionCard = styled.div`
  border: 2px solid #000000;
  padding: 20px;
  background-color: ${props => props.active ? '#f8f9fa' : '#ffffff'};
  position: relative;
  
  ${props => props.active && `
    animation: ${pulse} 2s infinite;
  `}
`;

const SessionTitle = styled.h2`
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const TimerDisplay = styled.div`
  font-size: 48px;
  font-weight: bold;
  font-family: monospace;
  text-align: center;
  margin: 20px 0;
  color: ${props => props.isRunning ? '#000000' : '#6c757d'};

  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  border: 2px solid #000000;
  position: relative;
  background-color: #ffffff;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background-color: #000000;
    transition: width 0.5s ease;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const StatCard = styled.div`
  border: 2px solid #e9ecef;
  padding: 15px;
  text-align: center;
  background-color: #ffffff;
  
  h3 {
    margin: 0 0 5px 0;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #6c757d;
  }
  
  .value {
    font-size: 32px;
    font-weight: bold;
    color: #000000;
  }
  
  .delta {
    font-size: 12px;
    color: ${props => props.positive ? '#28a745' : '#dc3545'};
    margin-top: 5px;
  }
`;

const PresenceList = styled.div`
  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const UserPresence = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserStatus = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => 
    props.status === 'online' ? '#28a745' :
    props.status === 'away' ? '#ffc107' :
    props.status === 'busy' ? '#dc3545' : '#6c757d'
  };
`;

const NotificationPanel = styled.div`
  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  max-height: 300px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  padding: 10px;
  border: 1px solid #e9ecef;
  margin-bottom: 8px;
  background-color: ${props => props.read ? '#f8f9fa' : '#ffffff'};
  animation: ${props => props.isNew ? slideIn : 'none'} 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  .title {
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .message {
    font-size: 14px;
    color: #6c757d;
  }
  
  .time {
    font-size: 12px;
    color: #adb5bd;
    margin-top: 4px;
  }
`;

const SyncStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 10px;
  padding: 8px;
  border: 1px solid #e9ecef;
  font-size: 12px;
  
  .queue-count {
    font-weight: bold;
    color: ${props => props.hasQueue ? '#ffc107' : '#28a745'};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  
  button {
    padding: 8px 16px;
    border: 2px solid #000000;
    background-color: #ffffff;
    color: #000000;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
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
  }
`;

export const RealtimeDashboard = () => {
  const { connectionStatus, isOnline } = useRealtime();
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
  } = useRealtimeSession();
  
  const {
    userStats,
    streakData,
    globalLeaderboard,
    getUserRank,
  } = useRealtimeStats();
  
  const {
    onlineUsers,
    presenceState,
    setStatus,
  } = usePresence();
  
  const {
    notifications,
    markNotificationAsRead,
    clearNotifications,
    requestPermission,
    permissionStatus,
  } = useNotifications();
  
  const {
    offlineQueue,
    syncStatus,
    processOfflineQueue,
  } = useOfflineSync();

  const [newNotifications, setNewNotifications] = useState(new Set());

  // Format time helper
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle new notifications
  useEffect(() => {
    const newIds = notifications
      .filter(n => !n.read)
      .slice(0, 3)
      .map(n => n.id);
    
    setNewNotifications(new Set(newIds));
    
    // Clear new status after 3 seconds
    const timer = setTimeout(() => {
      setNewNotifications(new Set());
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [notifications]);

  const handleStartSession = async () => {
    try {
      await createSession({
        title: 'Focus Session',
        duration: 25,
        goal: 'Deep work',
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
  };

  const userRank = getUserRank();

  return (
    <DashboardContainer>
      <MainContent>
        {/* Connection Status */}
        <ConnectionStatus status={connectionStatus}>
          <StatusIndicator status={connectionStatus} />
          {connectionStatus === 'connected' && isOnline && 'Real-time Connected'}
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'disconnected' && 'Offline Mode'}
          {!isOnline && ' (No Internet)'}
        </ConnectionStatus>

        {/* Active Session */}
        {session ? (
          <SessionCard active={isRunning}>
            <SessionTitle>{session.title}</SessionTitle>
            <TimerDisplay isRunning={isRunning}>
              {formatTime(timeRemaining)}
            </TimerDisplay>
            <ProgressBar progress={progress} />
            
            <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
              Goal: {session.goal || 'No specific goal'}
              {session.tags && ` • Tags: ${session.tags}`}
            </div>

            <ActionButtons>
              {isRunning && (
                <button onClick={pauseSession}>Pause</button>
              )}
              {isPaused && (
                <button onClick={resumeSession}>Resume</button>
              )}
              <button onClick={completeSession} disabled={!isRunning && !isPaused}>
                Complete
              </button>
              <button onClick={stopSession}>Stop</button>
            </ActionButtons>

            {conflicts.length > 0 && (
              <div style={{ marginTop: '10px', padding: '10px', border: '2px solid #ffc107', backgroundColor: '#fff3cd' }}>
                <strong>Sync Conflict Detected</strong><br/>
                Session was modified on another device. Please resolve conflicts.
              </div>
            )}
          </SessionCard>
        ) : (
          <SessionCard>
            <SessionTitle>No Active Session</SessionTitle>
            <p>Start a new Pomodoro session to begin focusing.</p>
            <ActionButtons>
              <button onClick={handleStartSession}>Start Session</button>
            </ActionButtons>
          </SessionCard>
        )}

        {/* Stats Overview */}
        <div>
          <h2 style={{ marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Statistics
          </h2>
          <StatsGrid>
            <StatCard>
              <h3>Today's Sessions</h3>
              <div className="value">{userStats?.todayStats?.completedSessions || 0}</div>
            </StatCard>
            <StatCard>
              <h3>Total Sessions</h3>
              <div className="value">{userStats?.completed_sessions || 0}</div>
            </StatCard>
            <StatCard>
              <h3>Current Streak</h3>
              <div className="value">{streakData?.current || 0}</div>
            </StatCard>
            <StatCard>
              <h3>Global Rank</h3>
              <div className="value">{userRank ? `#${userRank}` : '-'}</div>
            </StatCard>
          </StatsGrid>
        </div>
      </MainContent>

      <Sidebar>
        {/* Presence */}
        <PresenceList>
          <h3>Online Users ({onlineUsers.length})</h3>
          {onlineUsers.slice(0, 10).map(user => (
            <UserPresence key={user.user_id}>
              <UserStatus status={user.status || 'online'} />
              <span>{user.username || user.user_id}</span>
              {user.activity === 'in_session' && (
                <span style={{ fontSize: '12px', color: '#6c757d' }}>🍅</span>
              )}
            </UserPresence>
          ))}
          {onlineUsers.length === 0 && (
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              No other users online
            </div>
          )}
        </PresenceList>

        {/* Notifications */}
        <NotificationPanel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Notifications ({notifications.filter(n => !n.read).length})</h3>
            {permissionStatus !== 'granted' && (
              <button 
                onClick={requestPermission}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '12px',
                  border: '1px solid #6c757d',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                Enable
              </button>
            )}
          </div>
          
          {notifications.slice(0, 5).map(notification => (
            <NotificationItem
              key={notification.id}
              read={notification.read}
              isNew={newNotifications.has(notification.id)}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="title">{notification.title}</div>
              <div className="message">{notification.message}</div>
              <div className="time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </NotificationItem>
          ))}
          
          {notifications.length === 0 && (
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              No notifications
            </div>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '10px',
                border: '1px solid #6c757d',
                background: 'none',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Clear All
            </button>
          )}
        </NotificationPanel>

        {/* Sync Status */}
        <SyncStatus hasQueue={offlineQueue.length > 0}>
          <div>
            <strong>Sync:</strong> {syncStatus}
          </div>
          <div className="queue-count">
            {offlineQueue.length > 0 ? `${offlineQueue.length} queued` : 'Up to date'}
          </div>
          {offlineQueue.length > 0 && (
            <button
              onClick={processOfflineQueue}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: '1px solid #000',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              Sync Now
            </button>
          )}
        </SyncStatus>
      </Sidebar>
    </DashboardContainer>
  );
};

export default RealtimeDashboard;