'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';
import { UserManager } from '../../../lib/services/UserManager';

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
  background: var(--background-primary);
  border-radius: 12px;
  border: 2px dashed #e9ecef;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

const EmptyRankingIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
  transition: all 0.3s ease;
  
  ${NoDataMessage}:hover & {
    transform: scale(1.1);
    opacity: 1;
  }
  
  @media (min-width: 769px) {
    font-size: 5rem;
    margin-bottom: 2rem;
  }
`;

const EmptyRankingTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
  
  ${NoDataMessage}:hover & {
    color: var(--primary-blue);
    transform: translateY(-2px);
  }
  
  @media (min-width: 769px) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const EmptyRankingDescription = styled.p`
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
  line-height: 1.6;
  max-width: 400px;
  transition: all 0.3s ease;
  
  ${NoDataMessage}:hover & {
    color: var(--text-primary);
    transform: translateY(-1px);
  }
  
  @media (min-width: 769px) {
    font-size: 1.1rem;
    max-width: 500px;
    margin-bottom: 2.5rem;
  }
`;

const EmptyRankingButton = styled.button`
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

// Generate real ranking data based on user statistics
const generateRealRankingData = (userManager) => {
  if (!userManager) return [];
  
  const allUsers = userManager.getAllUsers();
  const userRankings = [];

  Object.keys(allUsers).forEach(userId => {
    const user = allUsers[userId];
    const stats = userManager.getUserStats(userId);
    
    if (stats && stats.completedSessions > 0) {
      // Calculate score based on real user data
      const score = (stats.completedMinutes * 2) + (stats.completedSessions * 10) + (stats.streakDays * 5);
      
      userRankings.push({
        name: user.displayName || user.id,
        userId: userId,
        score: score,
        completedSessions: stats.completedSessions,
        completedMinutes: stats.completedMinutes,
        streakDays: stats.streakDays,
        achievement: getAchievementText(score),
        medal: '🏆'
      });
    }
  });

  // Sort by score and add rank
  return userRankings
    .sort((a, b) => b.score - a.score)
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));
};

const getAchievementText = (score) => {
  if (score >= 2000) return '뽀모도로 마스터';
  if (score >= 1500) return '뽀모도로 전문가';
  if (score >= 1000) return '뽀모도로 숙련자';
  if (score >= 500) return '뽀모도로 입문자';
  return '뽀모도로 새싹';
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
  const [userManager] = useState(() => new UserManager());

  useEffect(() => {
    // Generate ranking data based on real user statistics
    const data = generateRealRankingData(userManager);
    setRankingData(data);
  }, [currentUser, userManager]);

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
              <RankingItem key={user.userId || user.name} rank={user.rank}>
                <RankInfo>
                  <UserDetails>
                    <RankNumber rank={user.rank}>{user.rank}</RankNumber>
                    <UserName>{user.name}</UserName>
                    <UserMedal>{getMedalForRank(user.rank)}</UserMedal>
                  </UserDetails>
                  <UserMeta>
                    <UserAchievement>
                      {user.achievement} • 세션 {user.completedSessions}회 • {user.completedMinutes}분
                    </UserAchievement>
                  </UserMeta>
                </RankInfo>
                <UserScore>{user.score.toLocaleString()}</UserScore>
              </RankingItem>
            ))
          ) : (
            <NoDataMessage>
              <EmptyRankingIcon>🏆</EmptyRankingIcon>
              <EmptyRankingTitle>아직 랭킹이 없습니다</EmptyRankingTitle>
              <EmptyRankingDescription>
                뽀모도로 세션을 완료한 사용자가 없습니다.<br />
                첫 번째 뽀모도로를 시작해서 랭킹에 도전해보세요!
              </EmptyRankingDescription>
              <EmptyRankingButton onClick={() => router.push('/pomodoro-start')}>
                뽀모도로 시작하기
              </EmptyRankingButton>
            </NoDataMessage>
          )}
        </RankingSection>
      </MainContent>
    </RankingContainer>
  );
}

