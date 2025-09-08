'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

const RankingContainer = styled.div`
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
  padding: 20px;
  overflow-y: auto;

  @media (min-width: 769px) {
    padding: 30px;
  }
`;

const MonthSelector = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;
`;

const MonthNav = styled.button`
  background: none;
  border: none;
  color: var(--primary-blue);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);

  &:hover {
    background: rgba(0, 122, 255, 0.1);
  }

  &:disabled {
    color: var(--text-secondary);
    cursor: not-allowed;
  }
`;

const MonthDisplay = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const MonthButton = styled.button`
  background: var(--background-primary);
  border: 1px solid var(--gray-5);
  border-radius: var(--border-radius-medium);
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition-fast);

  &:hover {
    background: var(--gray-6);
  }
`;

const RankingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RankingItem = styled.div`
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  box-shadow: var(--shadow-small);
  border: 1px solid var(--gray-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: var(--transition-fast);

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-medium);
  }

  ${props => {
    if (props.rank === 1) {
      return `
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: white;
        border: none;
        
        * {
          color: white !important;
        }
      `;
    }
    if (props.rank === 2) {
      return `
        background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%);
        color: white;
        border: none;
        
        * {
          color: white !important;
        }
      `;
    }
    if (props.rank === 3) {
      return `
        background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
        color: white;
        border: none;
        
        * {
          color: white !important;
        }
      `;
    }
    return '';
  }}
`;

const RankInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RankNumber = styled.div`
  width: 32px;
  height: 32px;
  background: var(--primary-blue);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  margin-right: 12px;

  ${props => {
    if (props.rank === 1) return 'background: #FFD700; color: #B8860B;';
    if (props.rank === 2) return 'background: #C0C0C0; color: #696969;';
    if (props.rank === 3) return 'background: #CD7F32; color: #8B4513;';
    return '';
  }}
`;

const UserName = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
`;

const UserMedal = styled.span`
  font-size: 20px;
`;

const UserMeta = styled.div`
  margin-left: 44px;
`;

const UserAchievement = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
`;

const UserScore = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  font-size: 16px;
`;

// Mock ranking data
const generateMockRankingData = (currentUser) => {
  const mockUsers = [
    { name: '홍길동', score: 2400, achievement: '2000점 이상', medal: '🥇' },
    { name: '김정지', score: 1700, achievement: '500점 이상', medal: '🥈' },
    { name: '잠순이', score: 1200, achievement: '1000점 이상', medal: '🥉' },
    { name: '이철수', score: 950, achievement: '900점 이상', medal: '🏅' },
    { name: '박영희', score: 850, achievement: '800점 이상', medal: '🎖️' },
  ];

  // Add current user if not already in ranking
  if (currentUser) {
    const userInRanking = mockUsers.find(user => user.name === currentUser.id);
    if (!userInRanking) {
      // Calculate user score based on stats (mock calculation)
      const userScore = Math.floor(Math.random() * 500) + 300;
      mockUsers.push({
        name: currentUser.id,
        score: userScore,
        achievement: `${Math.floor(userScore / 100) * 100}점 이상`,
        medal: '🏆'
      });
    }
  }

  // Sort by score and add rank
  return mockUsers
    .sort((a, b) => b.score - a.score)
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));
};

const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];

export default function PomodoroRankingPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [rankingData, setRankingData] = useState([]);

  useEffect(() => {
    // Generate ranking data for current user
    const data = generateMockRankingData(currentUser);
    setRankingData(data);
  }, [currentUser]);

  const handleBack = () => {
    router.push('/main');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => (prev - 1 + 12) % 12);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => (prev + 1) % 12);
  };

  const getMedalForRank = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      case 4: return '🏅';
      case 5: return '🎖️';
      default: return '🏆';
    }
  };

  return (
    <RankingContainer>
      <AppHeader>
        <BackButton onClick={handleBack}>뒤로</BackButton>
        <AppTitle>뽀모도로 랭킹</AppTitle>
        <HeaderSpacer />
      </AppHeader>

      <MainContent>
        <MonthSelector>
          <MonthNav onClick={handlePrevMonth}>
            &lt; 이전 달
          </MonthNav>
          <MonthDisplay>
            <MonthButton>
              {MONTHS[currentMonth]}
              <span style={{ transform: 'rotate(90deg)' }}>›</span>
            </MonthButton>
          </MonthDisplay>
          <MonthNav onClick={handleNextMonth}>
            다음 달 &gt;
          </MonthNav>
        </MonthSelector>

        <RankingSection>
          {rankingData.length > 0 ? (
            rankingData.map((user, index) => (
              <RankingItem key={user.name} rank={user.rank}>
                <RankInfo>
                  <UserDetails>
                    <RankNumber rank={user.rank}>{user.rank}</RankNumber>
                    <UserName>{user.name}</UserName>
                    <UserMedal>{getMedalForRank(user.rank)}</UserMedal>
                  </UserDetails>
                  <UserMeta>
                    <UserAchievement>{user.achievement}</UserAchievement>
                  </UserMeta>
                </RankInfo>
                <UserScore>{user.score.toLocaleString()}</UserScore>
              </RankingItem>
            ))
          ) : (
            <NoDataMessage>
              이번 달 랭킹 데이터가 없습니다.
            </NoDataMessage>
          )}
        </RankingSection>
      </MainContent>
    </RankingContainer>
  );
}

