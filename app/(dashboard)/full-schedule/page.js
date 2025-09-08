'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

const ScheduleContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
  overflow: hidden;
`;

const Header = styled.div`
  background: var(--background-primary);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-5);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius-small);
  transition: var(--transition-fast);

  &:hover {
    background: var(--gray-6);
    color: var(--text-primary);
  }
`;

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--text-secondary);
  transition: var(--transition-fast);

  &:hover {
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const DateButton = styled.button`
  background: ${props => props.active ? 'var(--primary-blue)' : 'var(--gray-6)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-medium);
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 80px;

  &:hover {
    background: ${props => props.active ? 'var(--primary-blue)' : 'var(--gray-5)'};
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  align-content: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ScheduleCard = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 1.5rem;
  box-shadow: var(--shadow-small);
  border-left: 4px solid ${props => props.color || 'var(--primary-blue)'};
  position: relative;
  transition: var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
  }
`;

const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ScheduleTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
`;

const ScheduleCategory = styled.div`
  background: ${props => props.bgColor || 'var(--gray-6)'};
  color: ${props => props.textColor || 'var(--text-primary)'};
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-small);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ScheduleTime = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-weight: 500;
`;

const ScheduleDescription = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 'var(--primary-blue)' : 'var(--gray-6)'};
  color: ${props => props.primary ? 'white' : 'var(--text-primary)'};
  border: none;
  border-radius: var(--border-radius-small);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  flex: 1;

  &:hover {
    background: ${props => props.primary ? 'var(--primary-blue-dark, #0056CC)' : 'var(--gray-5)'};
  }
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${props => {
    switch(props.status) {
      case 'completed': return '#4CAF50';
      case 'in-progress': return '#FF9800';
      case 'pending': return '#9E9E9E';
      default: return 'var(--gray-4)';
    }
  }};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-small);
`;

const FloatingActionButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  background: var(--primary-blue);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: var(--shadow-large);
  transition: var(--transition-fast);
  z-index: 1000;

  &:hover {
    background: var(--primary-blue-dark, #0056CC);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default function FullSchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('1/30(목)');

  const handleClose = () => {
    router.push('/dashboard-onboarding');
  };

  const dates = [
    '1/28(화)',
    '1/29(수)', 
    '1/30(목)',
    '1/31(금)',
    '2/1(토)'
  ];

  const schedules = [
    {
      id: 1,
      title: '이메일 아침 키공',
      category: { text: '김김자', icon: '⭐', bgColor: '#9c88ff', textColor: 'white' },
      time: '09:00 ~ 13:00',
      description: '이메일 어벤그리고로스',
      color: '#ff6b6b',
      status: 'completed',
      actions: ['참석하기', '자세히 보기']
    },
    {
      id: 2,
      title: '크로스핏 방문',
      category: { text: '김김자', icon: '💪', bgColor: '#ffa726', textColor: 'white' },
      time: '14:00 ~ 16:00',
      description: 'F45 벤교집',
      color: '#ffeb3b',
      status: 'in-progress',
      actions: ['참석하기', '참석 안할래요']
    },
    {
      id: 3,
      title: '서현 오후 키공',
      category: { text: '참기자', icon: '🔥', bgColor: '#ff7043', textColor: 'white' },
      time: '09:00 ~ 16:00',
      description: '키보드부',
      color: '#ff6b6b',
      status: 'pending',
      actions: ['참석하기', '참석 안할래요']
    },
    {
      id: 4,
      title: '미팅 공부',
      category: { text: '김김자', icon: '📚', bgColor: '#9c88ff', textColor: 'white' },
      time: '14:00 ~ 18:00',
      description: '미팅 K-배일페이',
      color: '#ff6b6b',
      status: 'pending',
      actions: ['참석하기', '참석 안할래요']
    },
    {
      id: 5,
      title: '아팀 스타랔수 아팀글라',
      category: { text: '김김자', icon: '👥', bgColor: '#9c88ff', textColor: 'white' },
      time: '14:00 ~ 20:00',
      description: '스터디스 아팀글라쪽집',
      color: '#ff6b6b',
      status: 'pending',
      actions: ['참석하기', '참석 안할래요']
    },
    {
      id: 6,
      title: '분당 서현 카공',
      category: { text: '김김자', icon: '☕', bgColor: '#9c88ff', textColor: 'white' },
      time: '19:00 ~ 23:00',
      description: '투썰률레이스 서현카',
      color: '#42a5f5',
      status: 'pending',
      actions: ['참석하기', '자세히 보기']
    }
  ];

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'pending': return '예정';
      default: return '';
    }
  };

  return (
    <ScheduleContainer>
      <Header>
        <DateNavigation>
          <NavButton onClick={() => setSelectedDate(dates[Math.max(0, dates.indexOf(selectedDate) - 1)])}>
            ◀
          </NavButton>
          
          {dates.map((date) => (
            <DateButton
              key={date}
              active={selectedDate === date}
              onClick={() => setSelectedDate(date)}
            >
              {date}
            </DateButton>
          ))}
          
          <NavButton onClick={() => setSelectedDate(dates[Math.min(dates.length - 1, dates.indexOf(selectedDate) + 1)])}>
            ▶
          </NavButton>
        </DateNavigation>
        
        <CloseButton onClick={handleClose}>✕</CloseButton>
      </Header>

      <MainContent>
        {schedules.map((schedule) => (
          <ScheduleCard key={schedule.id} color={schedule.color}>
            <StatusBadge status={schedule.status}>
              {getStatusText(schedule.status)}
            </StatusBadge>
            
            <ScheduleHeader>
              <ScheduleTitle>{schedule.title}</ScheduleTitle>
              <ScheduleCategory 
                bgColor={schedule.category.bgColor}
                textColor={schedule.category.textColor}
              >
                {schedule.category.text} {schedule.category.icon}
              </ScheduleCategory>
            </ScheduleHeader>
            
            <ScheduleTime>{schedule.time}</ScheduleTime>
            <ScheduleDescription>{schedule.description}</ScheduleDescription>
            
            <ActionButtons>
              {schedule.actions.map((action, index) => (
                <ActionButton 
                  key={index}
                  primary={index === 0}
                  onClick={() => console.log(`${action} clicked for ${schedule.title}`)}
                >
                  {action}
                </ActionButton>
              ))}
            </ActionButtons>
          </ScheduleCard>
        ))}
      </MainContent>

      <FloatingActionButton onClick={() => console.log('Add new schedule')}>
        +
      </FloatingActionButton>
    </ScheduleContainer>
  );
}

