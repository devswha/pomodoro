'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

const MonthlyContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
`;

const AppHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--background-primary);
  border-bottom: 1px solid var(--gray-5);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-blue);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;

  &:hover {
    opacity: 0.7;
  }
`;

const AppTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const HeaderSpacer = styled.div`
  width: 60px;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  @media (min-width: 769px) {
    padding: 30px;
  }
`;

const CalendarSection = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-small);
  border: 1px solid var(--gray-6);

  @media (min-width: 769px) {
    padding: 24px;
    margin-bottom: 32px;
  }
`;

const MonthHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const MonthNav = styled.button`
  background: none;
  border: none;
  color: var(--primary-blue);
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--border-radius-small);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(0, 122, 255, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const MonthTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const CalendarContainer = styled.div`
  width: 100%;
`;

const WeekdayHeaders = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
`;

const WeekdayHeader = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 8px 4px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const CalendarDay = styled.button`
  aspect-ratio: 1;
  background: ${props => {
    if (props.isToday) return 'var(--primary-blue)';
    if (props.hasSession) return 'var(--primary-green)';
    if (props.isOtherMonth) return 'transparent';
    return 'var(--background-secondary)';
  }};
  color: ${props => {
    if (props.isToday) return 'white';
    if (props.hasSession) return 'white';
    if (props.isOtherMonth) return 'var(--text-tertiary)';
    return 'var(--text-primary)';
  }};
  border: 1px solid ${props => props.isOtherMonth ? 'transparent' : 'var(--gray-5)'};
  border-radius: var(--border-radius-small);
  font-size: 14px;
  font-weight: ${props => props.isToday ? '700' : '500'};
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 40px;

  &:hover:not(:disabled) {
    background: ${props => {
      if (props.isToday) return '#0056CC';
      if (props.hasSession) return '#2DB653';
      return 'var(--gray-5)';
    }};
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const SessionIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: var(--primary-orange);
  border-radius: 50%;
  border: 1px solid white;
`;

const SessionsSection = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: var(--shadow-small);
  border: 1px solid var(--gray-6);

  @media (min-width: 769px) {
    padding: 24px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SessionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--gray-6);
`;

const SessionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SessionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
`;

const SessionMeta = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const SessionTime = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-blue);
`;

const SessionStatus = styled.div`
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    if (props.status === 'completed') {
      return `
        background: rgba(52, 199, 89, 0.1);
        color: var(--primary-green);
      `;
    }
    if (props.status === 'stopped') {
      return `
        background: rgba(255, 59, 48, 0.1);
        color: var(--primary-red);
      `;
    }
    return `
      background: rgba(142, 142, 147, 0.1);
      color: var(--text-secondary);
    `;
  }}
`;

const NoSessionsMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 16px;
`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function MonthlyPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [userSessions, setUserSessions] = useState([]);

  useEffect(() => {
    if (currentUser) {
      // Mock sessions for now - replace with actual API calls
      const mockSessions = [];
      setUserSessions(mockSessions);
    }
  }, [currentUser]);

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 42); // 6 weeks
    
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const sessionsForDate = userSessions.filter(session => 
        session.startTime && session.startTime.startsWith(dateString)
      );
      
      days.push({
        date: new Date(d),
        dateString,
        isCurrentMonth: d.getMonth() === month,
        isToday: dateString === new Date().toISOString().split('T')[0],
        hasSession: sessionsForDate.length > 0,
        sessions: sessionsForDate
      });
    }
    
    return days;
  }, [currentDate, userSessions]);

  // Get sessions for selected date or current month
  const filteredSessions = useMemo(() => {
    if (selectedDate) {
      return userSessions.filter(session => 
        session.startTime && session.startTime.startsWith(selectedDate)
      );
    }
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthString = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    
    return userSessions.filter(session => 
      session.startTime && session.startTime.startsWith(monthString)
    );
  }, [userSessions, selectedDate, currentDate]);

  const handleBack = () => {
    router.push('/main');
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.dateString);
    }
  };

  const formatSessionTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'completed';
      case 'stopped': return 'stopped';
      default: return 'scheduled';
    }
  };

  const monthTitle = `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <MonthlyContainer>
      <AppHeader>
        <BackButton onClick={handleBack}>← 뒤로</BackButton>
        <AppTitle>월별 기록</AppTitle>
        <HeaderSpacer />
      </AppHeader>

      <MainContent>
        <CalendarSection>
          <MonthHeader>
            <MonthNav onClick={handlePrevMonth}>‹</MonthNav>
            <MonthTitle>{monthTitle}</MonthTitle>
            <MonthNav onClick={handleNextMonth}>›</MonthNav>
          </MonthHeader>

          <CalendarContainer>
            <WeekdayHeaders>
              {WEEKDAYS.map(day => (
                <WeekdayHeader key={day}>{day}</WeekdayHeader>
              ))}
            </WeekdayHeaders>

            <CalendarGrid>
              {calendarDays.map((day, index) => (
                <CalendarDay
                  key={index}
                  isCurrentMonth={day.isCurrentMonth}
                  isToday={day.isToday}
                  hasSession={day.hasSession}
                  isOtherMonth={!day.isCurrentMonth}
                  onClick={() => handleDateClick(day)}
                  disabled={!day.isCurrentMonth}
                >
                  {day.date.getDate()}
                  {day.hasSession && <SessionIndicator />}
                </CalendarDay>
              ))}
            </CalendarGrid>
          </CalendarContainer>
        </CalendarSection>

        <SessionsSection>
          <SectionTitle>
            {selectedDate ? 
              `${new Date(selectedDate).toLocaleDateString('ko-KR')} 세션` : 
              `${MONTHS[currentDate.getMonth()]} 세션`
            }
          </SectionTitle>
          
          <SessionsList>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session, index) => (
                <SessionItem key={session.id || index}>
                  <SessionInfo>
                    <SessionTitle>{session.title || '뽀모도로 세션'}</SessionTitle>
                    <SessionMeta>
                      {session.goal && `목표: ${session.goal}`}
                      {session.duration && ` • ${session.duration}분`}
                      {session.tags && ` • ${session.tags}`}
                    </SessionMeta>
                  </SessionInfo>
                  <div>
                    <SessionTime>{formatSessionTime(session.startTime)}</SessionTime>
                    <SessionStatus status={getStatusColor(session.status)}>
                      {session.status === 'completed' && '완료'}
                      {session.status === 'stopped' && '중단'}
                      {session.status === 'scheduled' && '예정'}
                    </SessionStatus>
                  </div>
                </SessionItem>
              ))
            ) : (
              <NoSessionsMessage>
                {selectedDate ? 
                  '선택한 날짜에 세션이 없습니다.' : 
                  '이번 달에 진행한 세션이 없습니다.'
                }
              </NoSessionsMessage>
            )}
          </SessionsList>
        </SessionsSection>
      </MainContent>
    </MonthlyContainer>
  );
}

