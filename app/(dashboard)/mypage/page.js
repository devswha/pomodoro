'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
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

  &:hover {
    opacity: 0.7;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatCard = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  text-align: center;
  box-shadow: var(--shadow-small);
`;

const StatNumber = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const Section = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-small);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: var(--gray-6);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: var(--primary-blue);
  border-radius: 12px;
  transition: width 0.3s ease;
  width: ${props => props.percent}%;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary);
`;

const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
`;

const AchievementBadge = styled.div`
  aspect-ratio: 1;
  background: ${props => props.earned ? 'var(--primary-blue)' : 'var(--gray-6)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  opacity: ${props => props.earned ? 1 : 0.3};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }
`;

const WeekChart = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100px;
  margin-top: 20px;
`;

const DayBar = styled.div`
  flex: 1;
  margin: 0 4px;
  background: var(--primary-blue);
  border-radius: 4px 4px 0 0;
  height: ${props => props.height}%;
  min-height: 4px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const DayLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
`;

const DayLabel = styled.div`
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
`;

export default function MyPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [stats, setStats] = useState({
    todayMinutes: 75,
    totalSessions: 156,
    completionRate: 85,
    currentStreak: 7
  });

  const [weekData] = useState([
    { day: '월', minutes: 50 },
    { day: '화', minutes: 75 },
    { day: '수', minutes: 100 },
    { day: '목', minutes: 60 },
    { day: '금', minutes: 90 },
    { day: '토', minutes: 30 },
    { day: '일', minutes: 45 }
  ]);

  const achievements = [
    { icon: '🔥', earned: true, title: '연속 7일' },
    { icon: '⭐', earned: true, title: '100회 달성' },
    { icon: '🏆', earned: true, title: '월간 챔피언' },
    { icon: '💎', earned: false, title: '1000분 달성' },
    { icon: '🎯', earned: false, title: '완벽한 한 주' },
    { icon: '🚀', earned: false, title: '속도의 달인' }
  ];

  const maxMinutes = Math.max(...weekData.map(d => d.minutes));

  return (
    <Container>
      <Header>
        <BackButton onClick={() => router.push('/main')}>
          ← 뒤로
        </BackButton>
        <Title>학습 통계</Title>
        <div style={{ width: 60 }} />
      </Header>

      <Content>
        <StatsGrid>
          <StatCard>
            <StatNumber>{stats.todayMinutes}분</StatNumber>
            <StatLabel>오늘 학습</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.totalSessions}회</StatNumber>
            <StatLabel>총 세션</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.completionRate}%</StatNumber>
            <StatLabel>완료율</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.currentStreak}일</StatNumber>
            <StatLabel>연속 학습</StatLabel>
          </StatCard>
        </StatsGrid>

        <Section>
          <SectionTitle>주간 학습 기록</SectionTitle>
          <WeekChart>
            {weekData.map((day, index) => (
              <DayBar
                key={index}
                height={(day.minutes / maxMinutes) * 100}
              />
            ))}
          </WeekChart>
          <DayLabels>
            {weekData.map((day, index) => (
              <DayLabel key={index}>{day.day}</DayLabel>
            ))}
          </DayLabels>
        </Section>

        <Section>
          <SectionTitle>이번 달 목표</SectionTitle>
          <ProgressBar>
            <ProgressFill percent={72} />
          </ProgressBar>
          <ProgressLabel>
            <span>1,260분 / 1,750분</span>
            <span>72% 달성</span>
          </ProgressLabel>
        </Section>

        <Section>
          <SectionTitle>획득한 배지</SectionTitle>
          <AchievementGrid>
            {achievements.map((achievement, index) => (
              <AchievementBadge
                key={index}
                earned={achievement.earned}
                title={achievement.title}
              >
                {achievement.icon}
              </AchievementBadge>
            ))}
          </AchievementGrid>
        </Section>
      </Content>
    </Container>
  );
}