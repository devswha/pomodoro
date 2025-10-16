'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';
import { useRealtime } from '../../../lib/contexts/RealtimeContext';
import Navigation, { NavSpacer } from '../../../lib/components/Navigation';
import { RealtimeDashboard } from '../../../lib/components/RealtimeDashboard';
import { RealtimeTimer } from '../../../lib/components/RealtimeTimer';

const MainContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
  
  @media (min-width: 769px) {
    min-height: auto;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(248, 249, 250, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-radius: 50%;
  border-top: 3px solid #000000;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
  text-align: center;
`;

const UserHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--background-primary);
  border-bottom: 1px solid var(--gray-5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  @media (min-width: 769px) {
    padding: 1.5rem 2rem;
  }
  
  @media (min-width: 1200px) {
    padding: 2rem 3rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  background: ${props => props.gradient || 'linear-gradient(135deg, var(--primary-blue), var(--primary-purple))'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
`;

const UserWelcome = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const HeaderButton = styled.button`
  background: var(--background-secondary);
  border: 1px solid var(--gray-5);
  border-radius: var(--border-radius-small);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: var(--gray-5);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const OnboardingButton = styled(HeaderButton)`
  background: var(--primary-blue);
  color: white;
  border: 1px solid var(--primary-blue);

  &:hover {
    background: var(--primary-blue-dark, #0056CC);
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 769px) {
    padding: 2rem;
    gap: 2.5rem;
  }
  
  @media (min-width: 1200px) {
    padding: 3rem;
    gap: 3rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (min-width: 769px) {
    gap: 1.5rem;
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: 1200px) {
    gap: 2rem;
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`;

const StatCard = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: var(--shadow-small);
  border: 1px solid var(--gray-6);

  @media (min-width: 769px) {
    padding: 24px;
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const StatTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const StatLink = styled.button`
  background: none;
  border: none;
  color: var(--primary-blue);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;

  &:hover {
    opacity: 0.7;
  }
`;

const ChartContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  position: relative;
`;

const ProgressChart = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`;

const ChartCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const ChartValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
`;

const ChartLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 2px;
`;

const ChartPlaceholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  background: var(--gray-6);
  border-radius: var(--border-radius-medium);
  font-size: 14px;
  color: var(--text-secondary);
`;

const ActionsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 769px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2rem;
  }
`;

const ActionCard = styled.button`
  background: var(--background-primary);
  border: 2px solid var(--gray-5);
  border-radius: var(--border-radius-large);
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-small);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--primary-blue);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    background: var(--gray-6);
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-blue);
    
    &::before {
      transform: scaleY(1);
    }
  }

  &:active {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  }

  @media (min-width: 769px) {
    padding: 2rem;
    min-height: 140px;
    border-radius: 12px;
  }
  
  @media (min-width: 1200px) {
    padding: 2.5rem;
    min-height: 160px;
    border-radius: 16px;
  }
`;

const ActionIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.8;
  transition: all 0.3s ease;
  
  ${ActionCard}:hover & {
    transform: scale(1.1);
    opacity: 1;
  }
  
  @media (min-width: 769px) {
    font-size: 2.5rem;
    margin-bottom: 1.25rem;
  }
`;

const ActionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  transition: all 0.3s ease;
  
  ${ActionCard}:hover & {
    color: var(--primary-blue);
    transform: translateY(-1px);
  }
`;

const ActionDescription = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
  transition: all 0.3s ease;
  
  ${ActionCard}:hover & {
    color: var(--text-primary);
  }
`;

const TodaySection = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 2rem;
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--gray-6);
  grid-column: 1 / -1;

  @media (min-width: 769px) {
    padding: 2.5rem;
  }
  
  @media (min-width: 1200px) {
    padding: 3rem;
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;
    align-items: center;
  }
`;

const TodayTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
`;

const NoActiveSession = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: var(--background-primary);
  border-radius: 12px;
  border: 2px dashed #e9ecef;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-blue);
    background: #fafbff;
    transform: translateY(-2px);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-blue), var(--primary-purple), var(--primary-blue));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`;

const NoSessionIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
  transition: all 0.3s ease;
  
  ${NoActiveSession}:hover & {
    transform: scale(1.1);
    opacity: 1;
  }
  
  @media (min-width: 769px) {
    font-size: 4rem;
    margin-bottom: 2rem;
  }
`;

const NoSessionText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
  
  ${NoActiveSession}:hover & {
    color: var(--primary-blue);
    transform: translateY(-2px);
  }
`;

const NoSessionSubtitle = styled.div`
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  
  ${NoActiveSession}:hover & {
    color: var(--text-secondary);
    transform: translateY(-1px);
  }
`;

const StartSTEPButton = styled.button`
  background: var(--primary-blue);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: var(--primary-blue-dark, #0056CC);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 122, 255, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
  }
  
  @media (min-width: 769px) {
    padding: 1.25rem 2.5rem;
    font-size: 1rem;
    border-radius: 8px;
  }
`;

const ActiveSession = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SessionInfo = styled.div`
  text-align: center;
`;

const SessionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
`;

const SessionGoal = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const STEPTimer = styled.div`
  text-align: center;
`;

const TimerDisplay = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: 16px;
  font-feature-settings: 'tnum';
`;

const TimerProgress = styled.div`
  width: 100%;
  height: 8px;
  background: var(--gray-5);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), var(--primary-purple));
  border-radius: 4px;
  width: ${props => props.progress}%;
  transition: width 1s ease-out;
`;

const STEPActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const STEPButton = styled.button`
  flex: 1;
  max-width: 120px;
  height: 44px;
  border: none;
  border-radius: var(--border-radius-medium);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);

  &.pause {
    background: var(--primary-orange);
    color: white;

    &:hover {
      background: #E6830A;
    }
  }

  &.stop {
    background: var(--primary-red);
    color: white;

    &:hover {
      background: #D70015;
    }
  }

  &:active {
    transform: scale(0.95);
  }
`;

const MeetingCard = styled.div`
  border: 2px solid #e9ecef;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #000000;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MeetingTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #000000;
  margin: 0 0 0.25rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MeetingTime = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
`;

const MeetingLocation = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
`;

const NoMeetings = styled.div`
  padding: 2rem;
  text-align: center;
  border: 2px dashed #e9ecef;
  color: #6c757d;
  background: #ffffff;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #000000;
    cursor: pointer;
  }
`;

const NoMeetingsText = styled.div`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #000000;
  font-weight: 600;
`;

const NoMeetingsSubtitle = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 1rem;
`;

const QuickActionButton = styled.button`
  background: #000000;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #333333;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// UpcomingMeetings Component
const UpcomingMeetings = () => {
  const { currentUser, sessionToken } = useUser();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (currentUser && sessionToken) {
      loadUpcomingMeetings();
    }
  }, [currentUser, sessionToken]);

  const loadUpcomingMeetings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const meetings = data.meetings || [];
        // Get next 3 upcoming meetings
        const now = new Date();
        const upcoming = meetings
          .filter(meeting => {
            const meetingDate = new Date(meeting.meeting_date + ' ' + meeting.meeting_time);
            return meetingDate > now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.meeting_date + ' ' + a.meeting_time);
            const dateB = new Date(b.meeting_date + ' ' + b.meeting_time);
            return dateA - dateB;
          })
          .slice(0, 3);
        setUpcomingMeetings(upcoming);
      } else {
        console.error('Failed to load meetings');
        setUpcomingMeetings([]);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
      setUpcomingMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    const meetingDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let dateStr = '';
    if (meetingDate.toDateString() === today.toDateString()) {
      dateStr = '오늘';
    } else if (meetingDate.toDateString() === tomorrow.toDateString()) {
      dateStr = '내일';
    } else {
      dateStr = meetingDate.toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    return `${dateStr} ${time}`;
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <LoadingSpinner />
      </div>
    );
  }
  
  if (upcomingMeetings.length === 0) {
    return (
      <NoMeetings onClick={() => router.push('/meetings')}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
        <NoMeetingsText>예정된 모임이 없습니다</NoMeetingsText>
        <NoMeetingsSubtitle>모임 일정을 추가해보세요!</NoMeetingsSubtitle>
        <QuickActionButton onClick={(e) => { e.stopPropagation(); router.push('/meetings'); }}>
          모임 추가하기
        </QuickActionButton>
      </NoMeetings>
    );
  }

  return (
    <div>
      {upcomingMeetings.map(meeting => (
        <MeetingCard 
          key={meeting.id}
          onClick={() => router.push('/meetings')}
        >
          <MeetingTitle>{meeting.title}</MeetingTitle>
          <MeetingTime>{formatDateTime(meeting.date, meeting.time)}</MeetingTime>
          {meeting.location && (
            <MeetingLocation>📍 {meeting.location}</MeetingLocation>
          )}
        </MeetingCard>
      ))}
    </div>
  );
};

export default function MainPage() {
  const router = useRouter();
  const {
    currentUser,
    activeSession,
    logoutUser,
    loadActiveSession,
    stopSTEPSession
  } = useUser();
  const { isConnected, connectionStatus } = useRealtime();
  const [userStats, setUserStats] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRealtimeDashboard, setShowRealtimeDashboard] = useState(false);

  const getUserGradient = useCallback((userId) => {
    const gradients = [
      'linear-gradient(135deg, #007AFF, #5856D6)',
      'linear-gradient(135deg, #34C759, #32D74B)',
      'linear-gradient(135deg, #FF9500, #FF6B00)',
      'linear-gradient(135deg, #FF3B30, #D70015)',
      'linear-gradient(135deg, #5856D6, #AF52DE)',
    ];
    const hash = userId?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0;
    return gradients[hash % gradients.length];
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const updateTimer = useCallback(() => {
    if (!activeSession || isPaused) return;

    const now = new Date();
    const startTime = new Date(activeSession.start_time);
    const duration = activeSession.duration || 25; // minutes
    const elapsed = Math.floor((now - startTime) / 1000); // seconds
    const totalSeconds = duration * 60;
    const remaining = Math.max(0, totalSeconds - elapsed);

    setTimeRemaining(remaining);

    if (remaining === 0) {
      // Session completed
      setIsTimerRunning(false);
      stopSTEPSession();
    }
  }, [activeSession, isPaused, stopSTEPSession]);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      // Load active session if exists
      loadActiveSession(currentUser.id);

      // Simulate loading for better UX
      setTimeout(() => {
        // For demo, use mock stats or fetch from database
        const mockStats = {
          todayMinutes: 0,
          todayPomodoros: 0,
          weeklyMinutes: 0,
          completionRate: 0
        };
        setUserStats(mockStats);
        setIsLoading(false);
      }, 500);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeSession && !isPaused) {
      setIsTimerRunning(true);
      updateTimer(); // Initial call to set time immediately
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setIsTimerRunning(false);
    }
  }, [activeSession, isPaused, updateTimer]);

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  const handleStudyStats = () => {
    router.push('/mypage');
  };

  const handleMonthlyStats = () => {
    router.push('/monthly');
  };

  const handleSTEPStart = () => {
    router.push('/step-start');
  };

  const handleSTEPRanking = () => {
    router.push('/step-ranking');
  };

  const handleEvent = () => {
    // Event functionality placeholder
  };

  const handlePauseSession = () => {
    setIsPaused(!isPaused);
  };

  const handleStopSession = async () => {
    if (activeSession) {
      await stopSTEPSession();
      setIsTimerRunning(false);
      setIsPaused(false);
      setTimeRemaining(0);
    }
  };

  const getCompletionRate = () => {
    // For demo, return a static completion rate or 0
    return userStats?.completionRate || 0;
  };

  const getTimerProgress = () => {
    if (!activeSession || timeRemaining === 0) return 0;
    const totalTime = activeSession.duration * 60;
    const elapsed = totalTime - timeRemaining;
    return Math.min(100, (elapsed / totalTime) * 100);
  };

  if (!currentUser) {
    return null;
  }
  
  if (isLoading) {
    return (
      <LoadingOverlay>
        <div>
          <LoadingSpinner />
          <LoadingText>대시보드를 불러오는 중...</LoadingText>
        </div>
      </LoadingOverlay>
    );
  }

  const userDisplayName = currentUser.display_name || currentUser.username || currentUser.id;

  // Show real-time dashboard if enabled
  if (showRealtimeDashboard) {
    return (
      <MainContainer>
        <UserHeader>
          <UserInfo>
            <UserAvatar gradient={getUserGradient(currentUser.id)}>
              {userDisplayName.charAt(0).toUpperCase()}
            </UserAvatar>
            <UserDetails>
              <UserName>{userDisplayName} - Real-time Dashboard</UserName>
              <UserWelcome>
                {connectionStatus === 'connected' && '🟢 Connected'}
                {connectionStatus === 'connecting' && '🟡 Connecting...'}
                {connectionStatus === 'disconnected' && '🔴 Disconnected'}
              </UserWelcome>
            </UserDetails>
          </UserInfo>
          <HeaderButtons>
            <HeaderButton 
              onClick={() => setShowRealtimeDashboard(false)}
              style={{ 
                background: 'var(--primary-blue)',
                color: 'white',
                borderColor: 'var(--primary-blue)'
              }}
            >
              ← Back to Legacy
            </HeaderButton>
            <HeaderButton onClick={handleLogout}>로그아웃</HeaderButton>
          </HeaderButtons>
        </UserHeader>
        <RealtimeDashboard />
        <Navigation />
        <NavSpacer />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <UserHeader>
        <UserInfo>
          <UserAvatar gradient={getUserGradient(currentUser.id)}>
            {userDisplayName.charAt(0).toUpperCase()}
          </UserAvatar>
          <UserDetails>
            <UserName>{userDisplayName}</UserName>
            <UserWelcome>안녕하세요! 👋</UserWelcome>
          </UserDetails>
        </UserInfo>
        <HeaderButtons>
          <HeaderButton 
            onClick={() => setShowRealtimeDashboard(!showRealtimeDashboard)}
            style={{ 
              background: showRealtimeDashboard ? 'var(--primary-blue)' : 'var(--background-secondary)',
              color: showRealtimeDashboard ? 'white' : 'var(--text-primary)',
              borderColor: showRealtimeDashboard ? 'var(--primary-blue)' : 'var(--gray-5)'
            }}
          >
            {isConnected ? '🔴 LIVE' : '⚫ OFFLINE'} 
            {showRealtimeDashboard ? ' Dashboard' : ' View'}
          </HeaderButton>
          <OnboardingButton onClick={() => router.push('/dashboard-onboarding')}>
            온보딩
          </OnboardingButton>
          <HeaderButton onClick={() => router.push('/onboarding')}>
            사용법
          </HeaderButton>
          <HeaderButton onClick={handleLogout}>로그아웃</HeaderButton>
        </HeaderButtons>
      </UserHeader>

      <MainContent>
        <StatsSection>
          <StatCard>
            <StatHeader>
              <StatTitle>학습 통계</StatTitle>
              <StatLink onClick={handleStudyStats}>자세히 &gt;</StatLink>
            </StatHeader>
            <ChartContainer>
              <ProgressChart>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="45"
                    fill="none"
                    stroke="var(--gray-5)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60" cy="60" r="45"
                    fill="none"
                    stroke="var(--primary-blue)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(getCompletionRate() / 100) * 283.14} 283.14`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <ChartCenter>
                  <ChartValue>{getCompletionRate()}%</ChartValue>
                  <ChartLabel>완료</ChartLabel>
                </ChartCenter>
              </ProgressChart>
            </ChartContainer>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>월별 기록</StatTitle>
              <StatLink onClick={handleMonthlyStats}>자세히 &gt;</StatLink>
            </StatHeader>
            <ChartPlaceholder>
              📅 달력 이미지
            </ChartPlaceholder>
          </StatCard>
        </StatsSection>

        <ActionsSection>
          <ActionCard onClick={handleSTEPRanking}>
            <ActionIcon>🏆</ActionIcon>
            <ActionTitle>STEP 랭킹</ActionTitle>
            <ActionDescription>다른 사용자들과 비교해보세요</ActionDescription>
          </ActionCard>

          <ActionCard onClick={handleEvent}>
            <ActionIcon>🎉</ActionIcon>
            <ActionTitle>진행중인 이벤트</ActionTitle>
            <ActionDescription>특별한 혜택과 도전 과제</ActionDescription>
          </ActionCard>
        </ActionsSection>

        <TodaySection>
          <TodayTitle>진행중인 STEP</TodayTitle>
          {!activeSession ? (
            <NoActiveSession>
              <NoSessionIcon>⏰</NoSessionIcon>
              <NoSessionText>진행중인 STEP가 없습니다</NoSessionText>
              <NoSessionSubtitle>STEP를 시작해서 집중력을 높여보세요!</NoSessionSubtitle>
              <StartSTEPButton onClick={handleSTEPStart}>
                STEP 시작하기
              </StartSTEPButton>
            </NoActiveSession>
          ) : (
            <ActiveSession>
              <SessionInfo>
                <SessionTitle>{activeSession.title}</SessionTitle>
                <SessionGoal>{activeSession.goal}</SessionGoal>
              </SessionInfo>
              <STEPTimer>
                <TimerDisplay>{formatTime(timeRemaining)}</TimerDisplay>
                <TimerProgress>
                  <ProgressBar progress={getTimerProgress()} />
                </TimerProgress>
              </STEPTimer>
              <STEPActions>
                <STEPButton className="pause" onClick={handlePauseSession}>
                  {isPaused ? '재시작' : '일시정지'}
                </STEPButton>
                <STEPButton className="stop" onClick={handleStopSession}>
                  종료
                </STEPButton>
              </STEPActions>
            </ActiveSession>
          )}
        </TodaySection>

        <TodaySection>
          <TodayTitle>다가오는 모임</TodayTitle>
          <UpcomingMeetings />
        </TodaySection>
      </MainContent>
      
      <Navigation />
      <NavSpacer />
    </MainContainer>
  );
}

