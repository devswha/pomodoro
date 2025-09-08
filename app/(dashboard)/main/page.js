'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

const MainContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
  overflow-y: auto;
  
  @media (min-width: 1200px) {
    min-height: 900px;
  }
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
  border: 1px solid var(--gray-5);
  border-radius: var(--border-radius-large);
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-small);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:hover {
    background: var(--gray-6);
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 769px) {
    padding: 2rem;
    min-height: 140px;
  }
  
  @media (min-width: 1200px) {
    padding: 2.5rem;
    min-height: 160px;
  }
`;

const ActionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
`;

const ActionDescription = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
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
  padding: 40px 20px;
`;

const NoSessionText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
`;

const NoSessionSubtitle = styled.div`
  font-size: 14px;
  color: var(--text-tertiary);
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

const PomodoroTimer = styled.div`
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

const PomodoroActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const PomodoroButton = styled.button`
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
  border: 2px solid #e9ecef;
  color: #6c757d;
`;

const NoMeetingsText = styled.div`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #000000;
`;

const NoMeetingsSubtitle = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
`;

// UpcomingMeetings Component
const UpcomingMeetings = () => {
  const { currentUser, userManager } = useUser();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (currentUser && userManager) {
      const meetings = userManager.getUpcomingMeetings(currentUser.id, 3);
      setUpcomingMeetings(meetings);
    }
  }, [currentUser, userManager]);

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

  if (upcomingMeetings.length === 0) {
    return (
      <NoMeetings>
        <NoMeetingsText>예정된 모임이 없습니다</NoMeetingsText>
        <NoMeetingsSubtitle>모임 일정을 추가해보세요!</NoMeetingsSubtitle>
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
  const { currentUser, activeSession, logoutUser, getUserStats, completePomodoroSession, stopPomodoroSession } = useUser();
  const [userStats, setUserStats] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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
    const endTime = new Date(activeSession.endTime);
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    setTimeRemaining(remaining);

    if (remaining === 0) {
      // Session completed
      completePomodoroSession();
      setIsTimerRunning(false);
    }
  }, [activeSession, isPaused, completePomodoroSession]);

  useEffect(() => {
    if (currentUser) {
      const stats = getUserStats();
      setUserStats(stats);
    }
  }, [currentUser, getUserStats]);

  useEffect(() => {
    if (activeSession && !isPaused) {
      setIsTimerRunning(true);
      const interval = setInterval(updateTimer, 1000);
      updateTimer(); // Initial call
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

  const handlePomodoroStart = () => {
    router.push('/pomodoro-start');
  };

  const handlePomodoroRanking = () => {
    router.push('/pomodoro-ranking');
  };

  const handleEvent = () => {
    // Event functionality placeholder
  };

  const handlePauseSession = () => {
    setIsPaused(!isPaused);
  };

  const handleStopSession = () => {
    if (activeSession) {
      stopPomodoroSession();
    }
  };

  const getCompletionRate = () => {
    if (!userStats || userStats.totalSessions === 0) return 0;
    return Math.round((userStats.completedSessions / userStats.totalSessions) * 100);
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

  return (
    <MainContainer>
      <UserHeader>
        <UserInfo>
          <UserAvatar gradient={getUserGradient(currentUser.id)}>
            {currentUser.id.charAt(0).toUpperCase()}
          </UserAvatar>
          <UserDetails>
            <UserName>{currentUser.id}</UserName>
            <UserWelcome>안녕하세요! 👋</UserWelcome>
          </UserDetails>
        </UserInfo>
        <HeaderButtons>
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
          <ActionCard onClick={handlePomodoroStart}>
            <ActionTitle>뽀모도로 시작하기</ActionTitle>
            <ActionDescription>집중력 향상을 위한 시간 관리 기법</ActionDescription>
          </ActionCard>

          <ActionCard onClick={handlePomodoroRanking}>
            <ActionTitle>뽀모도로 랭킹</ActionTitle>
            <ActionDescription>다른 사용자들과 비교해보세요</ActionDescription>
          </ActionCard>

          <ActionCard onClick={handleEvent}>
            <ActionTitle>진행중인 이벤트</ActionTitle>
            <ActionDescription>특별한 혜택과 도전 과제</ActionDescription>
          </ActionCard>

          <ActionCard onClick={() => router.push('/meetings')}>
            <ActionTitle>모임 일정</ActionTitle>
            <ActionDescription>모임 일정을 확인하고 관리하세요</ActionDescription>
          </ActionCard>
        </ActionsSection>

        <TodaySection>
          <TodayTitle>진행중인 뽀모도로</TodayTitle>
          {!activeSession ? (
            <NoActiveSession>
              <NoSessionText>진행중인 뽀모도로가 없습니다</NoSessionText>
              <NoSessionSubtitle>뽀모도로를 시작해보세요!</NoSessionSubtitle>
            </NoActiveSession>
          ) : (
            <ActiveSession>
              <SessionInfo>
                <SessionTitle>{activeSession.title}</SessionTitle>
                <SessionGoal>{activeSession.goal}</SessionGoal>
              </SessionInfo>
              <PomodoroTimer>
                <TimerDisplay>{formatTime(timeRemaining)}</TimerDisplay>
                <TimerProgress>
                  <ProgressBar progress={getTimerProgress()} />
                </TimerProgress>
              </PomodoroTimer>
              <PomodoroActions>
                <PomodoroButton className="pause" onClick={handlePauseSession}>
                  {isPaused ? '재시작' : '일시정지'}
                </PomodoroButton>
                <PomodoroButton className="stop" onClick={handleStopSession}>
                  종료
                </PomodoroButton>
              </PomodoroActions>
            </ActiveSession>
          )}
        </TodaySection>

        <TodaySection>
          <TodayTitle>다가오는 모임</TodayTitle>
          <UpcomingMeetings />
        </TodaySection>
      </MainContent>
    </MainContainer>
  );
}

