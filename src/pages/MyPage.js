import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';

const MyPageContainer = styled.div`
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

const FilterHeader = styled.div`
  background: var(--background-primary);
  border-bottom: 1px solid var(--gray-5);
  padding: 16px 20px;
`;

const FilterControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PeriodSelector = styled.div`
  min-width: 80px;
`;

const PeriodSelect = styled.select`
  background: var(--background-secondary);
  border: 1px solid var(--gray-5);
  border-radius: var(--border-radius-small);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--primary-blue);
  }
`;

const DateRangeSelector = styled.div`
  flex: 1;
`;

const DateRangeButton = styled.button`
  width: 100%;
  background: var(--background-secondary);
  border: 1px solid var(--gray-5);
  border-radius: var(--border-radius-small);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;

  &:hover {
    background: var(--gray-6);
  }
`;

const SearchButton = styled.button`
  background: var(--primary-blue);
  border: none;
  border-radius: var(--border-radius-small);
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #0056CC;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  @media (min-width: 769px) {
    padding: 30px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (min-width: 769px) {
    gap: 20px;
    margin-bottom: 32px;
  }
`;

const StatCard = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: var(--shadow-small);
  border: 1px solid var(--gray-6);
  text-align: center;

  &.primary {
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-purple) 100%);
    color: white;
    border: none;
    
    * {
      color: white !important;
    }
  }

  &.achievement {
    border: 2px solid var(--primary-green);
    background: rgba(52, 199, 89, 0.05);
  }

  @media (min-width: 769px) {
    padding: 24px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
`;

const StatUnit = styled.span`
  font-size: 14px;
  font-weight: 500;
  margin-left: 4px;
`;

const StatHeader = styled.div`
  margin-bottom: 8px;
`;

const AchievementLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-green);
  background: rgba(52, 199, 89, 0.1);
  padding: 4px 8px;
  border-radius: var(--border-radius-small);
`;

const StatPercentage = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
`;

const ChartSection = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 24px;
  box-shadow: var(--shadow-small);
  border: 1px solid var(--gray-6);
  margin-bottom: 24px;

  @media (min-width: 769px) {
    margin-bottom: 32px;
  }
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  text-align: center;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-6);
  border-radius: var(--border-radius-medium);
  color: var(--text-secondary);
  font-size: 14px;

  @media (min-width: 769px) {
    height: 250px;
  }
`;

const ProgressChart = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 150px;
  height: 150px;
`;

const ChartCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const ChartValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
`;

const ChartLabel = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-top: 4px;
`;

function MyPage() {
  const navigate = useNavigate();
  const { currentUser, getUserStats, getUserSessions } = useUser();
  const [period, setPeriod] = useState('month');
  const [userStats, setUserStats] = useState(null);
  const [userSessions, setUserSessions] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const stats = getUserStats();
      const sessions = getUserSessions();
      setUserStats(stats);
      setUserSessions(sessions);
    }
  }, [currentUser, getUserStats, getUserSessions]);

  // Calculate display statistics
  const displayStats = useMemo(() => {
    if (!userStats) return null;

    const totalSessions = userStats.totalSessions || 0;
    const completedSessions = userStats.completedSessions || 0;
    const totalMinutes = userStats.totalMinutes || 0;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const streakDays = userStats.streakDays || 0;
    const longestStreak = userStats.longestStreak || 0;

    // Calculate focus sessions (completed sessions)
    const focusSessions = completedSessions;
    
    // Calculate stickers (achievements based on completion)
    const stickerCount = Math.floor(completedSessions / 2); // 2 completions = 1 sticker
    const stickerPercentage = Math.min(100, (stickerCount / 100) * 100); // Out of 100 total
    
    // Calculate series (consecutive days)
    const seriesCount = streakDays;
    const seriesPercentage = Math.min(100, (seriesCount / 30) * 100); // Out of 30 days
    
    return {
      focusSessions,
      totalSessions,
      stickerCount,
      stickerPercentage,
      seriesCount,
      seriesPercentage,
      completionRate,
      totalMinutes
    };
  }, [userStats]);

  const handleBack = () => {
    navigate('/main');
  };

  const formatDateRange = () => {
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${now.toLocaleDateString('en-US', options)} → ${now.toLocaleDateString('en-US', options)}`;
  };

  if (!currentUser || !displayStats) {
    return (
      <MyPageContainer>
        <AppHeader>
          <BackButton onClick={handleBack}>뒤로</BackButton>
          <AppTitle>My Page</AppTitle>
          <HeaderSpacer />
        </AppHeader>
        <MainContent>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            데이터를 불러오는 중...
          </div>
        </MainContent>
      </MyPageContainer>
    );
  }

  return (
    <MyPageContainer>
      <AppHeader>
        <BackButton onClick={handleBack}>뒤로</BackButton>
        <AppTitle>{currentUser.id}의 My Page</AppTitle>
        <HeaderSpacer />
      </AppHeader>

      <FilterHeader>
        <FilterControls>
          <PeriodSelector>
            <PeriodSelect value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </PeriodSelect>
          </PeriodSelector>
          <DateRangeSelector>
            <DateRangeButton>
              <span>{formatDateRange()}</span>
              <span>▼</span>
            </DateRangeButton>
          </DateRangeSelector>
          <SearchButton>
            🔍
          </SearchButton>
        </FilterControls>
      </FilterHeader>

      <MainContent>
        <StatsGrid>
          <StatCard className="primary">
            <StatLabel>가장 집중 횟수</StatLabel>
            <StatValue>
              {displayStats.focusSessions}
              <StatUnit>회</StatUnit>
            </StatValue>
          </StatCard>

          <StatCard className="primary">
            <StatLabel>총 뽀모도로 횟수</StatLabel>
            <StatValue>
              {displayStats.totalSessions}
              <StatUnit>회</StatUnit>
            </StatValue>
          </StatCard>

          <StatCard className="achievement">
            <StatHeader>
              <AchievementLabel>스티커 (+{Math.floor(displayStats.stickerCount * 0.1)})</AchievementLabel>
            </StatHeader>
            <StatValue>
              {displayStats.stickerCount}
              <StatUnit>개</StatUnit>
            </StatValue>
            <StatPercentage>({Math.round(displayStats.stickerPercentage)}%)</StatPercentage>
          </StatCard>

          <StatCard className="achievement">
            <StatHeader>
              <AchievementLabel>연속 (+{Math.floor(displayStats.seriesCount * 0.2)})</AchievementLabel>
            </StatHeader>
            <StatValue>
              {displayStats.seriesCount}
              <StatUnit>일</StatUnit>
            </StatValue>
            <StatPercentage>({Math.round(displayStats.seriesPercentage)}%)</StatPercentage>
          </StatCard>
        </StatsGrid>

        <ChartSection>
          <ChartTitle>완료율 통계</ChartTitle>
          <ChartContainer>
            <ProgressChart>
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle
                  cx="75" cy="75" r="60"
                  fill="none"
                  stroke="var(--gray-5)"
                  strokeWidth="12"
                />
                <circle
                  cx="75" cy="75" r="60"
                  fill="none"
                  stroke="var(--primary-blue)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(displayStats.completionRate / 100) * 377} 377`}
                  transform="rotate(-90 75 75)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <ChartCenter>
                <ChartValue>{displayStats.completionRate}%</ChartValue>
                <ChartLabel>완료율</ChartLabel>
              </ChartCenter>
            </ProgressChart>
          </ChartContainer>
        </ChartSection>

        <ChartSection>
          <ChartTitle>시간별 집중도 분석</ChartTitle>
          <ChartContainer>
            📊 시간별 분석 차트
            <br />
            <small>총 {displayStats.totalMinutes}분 집중</small>
          </ChartContainer>
        </ChartSection>
      </MainContent>
    </MyPageContainer>
  );
}

export default MyPage;