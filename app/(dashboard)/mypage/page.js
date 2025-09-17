'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';
import ProfileSettings from '../../../lib/components/ProfileSettings';
import PreferencesPanel from '../../../lib/components/PreferencesPanel';
import AchievementBadges from '../../../lib/components/AchievementBadges';

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

// New Profile Management Styles
const TabNavigation = styled.div`
  display: flex;
  background: var(--background-primary);
  border-bottom: 2px solid #000;
  border-radius: 0;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 16px;
  background: ${props => props.active ? '#000' : 'transparent'};
  color: ${props => props.active ? '#fff' : '#000'};
  border: none;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: ${props => props.active ? '1' : '0.7'};
  }

  @media (min-width: 769px) {
    padding: 20px;
    font-size: 16px;
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fff;

  @media (min-width: 769px) {
    padding: 30px;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding: 24px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 0;

  @media (min-width: 769px) {
    padding: 32px;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  background: ${props => props.src ? `url(${props.src}) center/cover` : '#000'};
  border: 2px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
  font-weight: 700;

  @media (min-width: 769px) {
    width: 100px;
    height: 100px;
    font-size: 40px;
  }
`;

const AvatarUpload = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h2`
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;

  @media (min-width: 769px) {
    font-size: 32px;
  }
`;

const UserEmail = styled.p`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;

  @media (min-width: 769px) {
    font-size: 16px;
  }
`;

const UserBio = styled.p`
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.4;

  @media (min-width: 769px) {
    font-size: 16px;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #000;
  padding-bottom: 8px;

  @media (min-width: 769px) {
    font-size: 20px;
  }
`;

export default function MyPage() {
  const router = useRouter();
  const { currentUser, getUserStats, getUserSessions, userManager } = useUser();
  const [period, setPeriod] = useState('month');
  const [userStats, setUserStats] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (currentUser && userManager) {
      const stats = getUserStats();
      const sessions = getUserSessions();
      const profile = userManager.getUser(currentUser.id);
      setUserStats(stats);
      setUserSessions(sessions);
      setUserProfile(profile);
    }
  }, [currentUser, getUserStats, getUserSessions, userManager]);

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
    router.push('/main');
  };

  const formatDateRange = () => {
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${now.toLocaleDateString('en-US', options)} → ${now.toLocaleDateString('en-US', options)}`;
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatar = e.target.result;
        if (userManager && currentUser) {
          userManager.updateUserProfile(currentUser.id, { avatar })
            .then((updatedProfile) => {
              setUserProfile(updatedProfile);
            })
            .catch(console.error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <ProfileHeader>
              <AvatarContainer>
                <Avatar src={userProfile?.avatar}>
                  {!userProfile?.avatar && (userProfile?.displayName || currentUser?.id || 'U')[0].toUpperCase()}
                </Avatar>
                <AvatarUpload
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </AvatarContainer>
              <ProfileInfo>
                <UserName>{userProfile?.displayName || currentUser?.id || 'User'}</UserName>
                <UserEmail>{userProfile?.email || 'No email provided'}</UserEmail>
                <UserBio>{userProfile?.bio || 'No bio available'}</UserBio>
              </ProfileInfo>
            </ProfileHeader>

            {displayStats && (
              <>
                <SectionTitle>Statistics Overview</SectionTitle>
                <StatsGrid>
                  <StatCard className="primary">
                    <StatLabel>Focus Sessions</StatLabel>
                    <StatValue>
                      {displayStats.focusSessions}
                      <StatUnit>sessions</StatUnit>
                    </StatValue>
                  </StatCard>

                  <StatCard className="primary">
                    <StatLabel>Total Pomodoros</StatLabel>
                    <StatValue>
                      {displayStats.totalSessions}
                      <StatUnit>sessions</StatUnit>
                    </StatValue>
                  </StatCard>

                  <StatCard className="achievement">
                    <StatHeader>
                      <AchievementLabel>Achievements</AchievementLabel>
                    </StatHeader>
                    <StatValue>
                      {displayStats.stickerCount}
                      <StatUnit>badges</StatUnit>
                    </StatValue>
                    <StatPercentage>({Math.round(displayStats.stickerPercentage)}%)</StatPercentage>
                  </StatCard>

                  <StatCard className="achievement">
                    <StatHeader>
                      <AchievementLabel>Streak</AchievementLabel>
                    </StatHeader>
                    <StatValue>
                      {displayStats.seriesCount}
                      <StatUnit>days</StatUnit>
                    </StatValue>
                    <StatPercentage>({Math.round(displayStats.seriesPercentage)}%)</StatPercentage>
                  </StatCard>
                </StatsGrid>

                <ChartSection>
                  <ChartTitle>Completion Rate</ChartTitle>
                  <ChartContainer>
                    <ProgressChart>
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        <circle
                          cx="75" cy="75" r="60"
                          fill="none"
                          stroke="#e9ecef"
                          strokeWidth="12"
                        />
                        <circle
                          cx="75" cy="75" r="60"
                          fill="none"
                          stroke="#000"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(displayStats.completionRate / 100) * 377} 377`}
                          transform="rotate(-90 75 75)"
                          style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      </svg>
                      <ChartCenter>
                        <ChartValue>{displayStats.completionRate}%</ChartValue>
                        <ChartLabel>Completion</ChartLabel>
                      </ChartCenter>
                    </ProgressChart>
                  </ChartContainer>
                </ChartSection>
              </>
            )}

            <AchievementBadges 
              userStats={userStats} 
              userSessions={userSessions}
            />
          </>
        );
      case 'settings':
        return (
          <ProfileSettings 
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            userManager={userManager}
            currentUser={currentUser}
          />
        );
      case 'preferences':
        return (
          <PreferencesPanel
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            userManager={userManager}
            currentUser={currentUser}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  if (!currentUser || !userProfile || !displayStats) {
    return (
      <MyPageContainer>
        <AppHeader>
          <BackButton onClick={handleBack}>Back</BackButton>
          <AppTitle>My Profile</AppTitle>
          <HeaderSpacer />
        </AppHeader>
        <MainContent>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            Loading profile data...
          </div>
        </MainContent>
      </MyPageContainer>
    );
  }

  return (
    <MyPageContainer>
      <AppHeader>
        <BackButton onClick={handleBack}>Back</BackButton>
        <AppTitle>My Profile</AppTitle>
        <HeaderSpacer />
      </AppHeader>

      <TabNavigation>
        <TabButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </TabButton>
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </TabButton>
        <TabButton 
          active={activeTab === 'preferences'} 
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </TabButton>
      </TabNavigation>

      <TabContent>
        {renderTabContent()}
      </TabContent>
    </MyPageContainer>
  );
}

