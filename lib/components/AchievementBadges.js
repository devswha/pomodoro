'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';

const AchievementsContainer = styled.div`
  margin-top: 32px;
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

const AchievementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;

  @media (min-width: 769px) {
    gap: 24px;
  }
`;

const AchievementCard = styled.div`
  background: #fff;
  border: 2px solid ${props => props.unlocked ? '#28a745' : '#ccc'};
  padding: 20px;
  border-radius: 0;
  position: relative;
  opacity: ${props => props.unlocked ? '1' : '0.6'};
  transition: all 0.2s ease;

  &:hover {
    opacity: ${props => props.unlocked ? '0.95' : '0.7'};
  }

  @media (min-width: 769px) {
    padding: 24px;
  }
`;

const BadgeIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.unlocked ? '#28a745' : '#ccc'};
  border: 2px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
  color: #fff;

  @media (min-width: 769px) {
    width: 70px;
    height: 70px;
    font-size: 32px;
  }
`;

const BadgeTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.unlocked ? '#000' : '#666'};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (min-width: 769px) {
    font-size: 18px;
  }
`;

const BadgeDescription = styled.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;

  @media (min-width: 769px) {
    font-size: 14px;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border: 1px solid #000;
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.complete ? '#28a745' : '#000'};
  width: ${props => Math.min(props.progress, 100)}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-align: center;

  @media (min-width: 769px) {
    font-size: 13px;
  }
`;

const UnlockedBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: #28a745;
  color: #fff;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 0;

  @media (min-width: 769px) {
    padding: 6px 10px;
    font-size: 11px;
  }
`;

const StatsOverview = styled.div`
  background: #fff;
  border: 2px solid #000;
  padding: 24px;
  margin-bottom: 32px;
  border-radius: 0;

  @media (min-width: 769px) {
    padding: 32px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;

  @media (min-width: 769px) {
    gap: 24px;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #000;
  margin-bottom: 8px;
  
  @media (min-width: 769px) {
    font-size: 40px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;

  @media (min-width: 769px) {
    font-size: 14px;
  }
`;

const TrendIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  font-size: 12px;
  color: ${props => props.trend === 'up' ? '#28a745' : props.trend === 'down' ? '#dc3545' : '#666'};
`;

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_session',
    title: 'Getting Started',
    description: 'Complete your first pomodoro session',
    icon: '🎯',
    requirement: (stats) => stats.completedSessions >= 1,
    progress: (stats) => Math.min(stats.completedSessions, 1),
    maxProgress: 1
  },
  {
    id: 'five_sessions',
    title: 'Focus Apprentice',
    description: 'Complete 5 pomodoro sessions',
    icon: '📚',
    requirement: (stats) => stats.completedSessions >= 5,
    progress: (stats) => Math.min(stats.completedSessions, 5),
    maxProgress: 5
  },
  {
    id: 'marathon',
    title: 'Marathon Runner',
    description: 'Complete 25 pomodoro sessions',
    icon: '🏃‍♂️',
    requirement: (stats) => stats.completedSessions >= 25,
    progress: (stats) => Math.min(stats.completedSessions, 25),
    maxProgress: 25
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Complete 100 pomodoro sessions',
    icon: '🏆',
    requirement: (stats) => stats.completedSessions >= 100,
    progress: (stats) => Math.min(stats.completedSessions, 100),
    maxProgress: 100
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    requirement: (stats) => stats.streakDays >= 7,
    progress: (stats) => Math.min(stats.streakDays, 7),
    maxProgress: 7
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '💪',
    requirement: (stats) => stats.streakDays >= 30,
    progress: (stats) => Math.min(stats.streakDays, 30),
    maxProgress: 30
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Achieve 90% completion rate with at least 20 sessions',
    icon: '⭐',
    requirement: (stats) => stats.completionRate >= 90 && stats.totalSessions >= 20,
    progress: (stats) => stats.totalSessions >= 20 ? Math.min(stats.completionRate, 90) : 0,
    maxProgress: 90
  },
  {
    id: 'time_master',
    title: 'Time Master',
    description: 'Accumulate 1000 minutes of focused work',
    icon: '⏰',
    requirement: (stats) => stats.completedMinutes >= 1000,
    progress: (stats) => Math.min(stats.completedMinutes, 1000),
    maxProgress: 1000
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete 10 sessions before 9 AM',
    icon: '🌅',
    requirement: (stats, sessions) => {
      const earlyMorningSessions = sessions.filter(session => {
        if (session.status !== 'completed') return false;
        const startHour = new Date(session.startTime).getHours();
        return startHour < 9;
      });
      return earlyMorningSessions.length >= 10;
    },
    progress: (stats, sessions) => {
      const earlyMorningSessions = sessions.filter(session => {
        if (session.status !== 'completed') return false;
        const startHour = new Date(session.startTime).getHours();
        return startHour < 9;
      });
      return Math.min(earlyMorningSessions.length, 10);
    },
    maxProgress: 10
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Complete 10 sessions after 8 PM',
    icon: '🦉',
    requirement: (stats, sessions) => {
      const eveningSessions = sessions.filter(session => {
        if (session.status !== 'completed') return false;
        const startHour = new Date(session.startTime).getHours();
        return startHour >= 20;
      });
      return eveningSessions.length >= 10;
    },
    progress: (stats, sessions) => {
      const eveningSessions = sessions.filter(session => {
        if (session.status !== 'completed') return false;
        const startHour = new Date(session.startTime).getHours();
        return startHour >= 20;
      });
      return Math.min(eveningSessions.length, 10);
    },
    maxProgress: 10
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete 20 sessions on weekends',
    icon: '🎮',
    requirement: (stats, sessions) => {
      const weekendSessions = sessions.filter(session => {
        if (session.status !== 'completed') return false;
        const dayOfWeek = new Date(session.startTime).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      });
      return weekendSessions.length >= 20;
    },
    progress: (stats, sessions) => {
      const weekendSessions = sessions.filter(session => {
        if (session.status !== 'completed') return false;
        const dayOfWeek = new Date(session.startTime).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
      });
      return Math.min(weekendSessions.length, 20);
    },
    maxProgress: 20
  },
  {
    id: 'goal_achiever',
    title: 'Goal Achiever',
    description: 'Meet your weekly goal for 4 consecutive weeks',
    icon: '🎯',
    requirement: (stats) => {
      // This would require more complex tracking of weekly achievements
      // For now, we'll use a simplified version based on total minutes vs goal
      const weeksActive = Math.ceil(stats.completedMinutes / (stats.weeklyGoal || 140));
      return weeksActive >= 4;
    },
    progress: (stats) => {
      const weeksActive = Math.ceil(stats.completedMinutes / (stats.weeklyGoal || 140));
      return Math.min(weeksActive, 4);
    },
    maxProgress: 4
  }
];

export default function AchievementBadges({ userStats, userSessions }) {
  const achievements = useMemo(() => {
    if (!userStats || !userSessions) return [];
    
    return ACHIEVEMENTS.map(achievement => {
      const unlocked = achievement.requirement(userStats, userSessions);
      const progress = achievement.progress(userStats, userSessions);
      const progressPercentage = (progress / achievement.maxProgress) * 100;
      
      return {
        ...achievement,
        unlocked,
        progress,
        progressPercentage
      };
    });
  }, [userStats, userSessions]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalAchievements = achievements.length;

  const personalStats = useMemo(() => {
    if (!userStats || !userSessions) return null;

    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setDate(thisMonth.getDate() - 30);

    const weekSessions = userSessions.filter(session => 
      new Date(session.createdAt) >= thisWeek && session.status === 'completed'
    );
    
    const monthSessions = userSessions.filter(session => 
      new Date(session.createdAt) >= thisMonth && session.status === 'completed'
    );

    const avgSessionLength = userStats.completedSessions > 0 
      ? Math.round(userStats.completedMinutes / userStats.completedSessions) 
      : 0;

    const weeklyProgress = userStats.weeklyGoal > 0 
      ? Math.round((weekSessions.reduce((sum, s) => sum + s.duration, 0) / userStats.weeklyGoal) * 100)
      : 0;

    return {
      totalBadges: unlockedAchievements.length,
      completionRate: userStats.completionRate || 0,
      currentStreak: userStats.streakDays || 0,
      avgSessionLength,
      weeklyProgress,
      monthlyMinutes: monthSessions.reduce((sum, s) => sum + s.duration, 0),
      bestStreak: userStats.longestStreak || 0
    };
  }, [userStats, userSessions, unlockedAchievements.length]);

  if (!userStats || !userSessions || !personalStats) {
    return (
      <AchievementsContainer>
        <SectionTitle>Achievements & Analytics</SectionTitle>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading achievements...
        </div>
      </AchievementsContainer>
    );
  }

  return (
    <AchievementsContainer>
      <SectionTitle>Personal Analytics</SectionTitle>
      
      <StatsOverview>
        <StatsGrid>
          <StatItem>
            <StatValue>{personalStats.totalBadges}</StatValue>
            <StatLabel>Badges Earned</StatLabel>
            <TrendIndicator>
              {personalStats.totalBadges}/{totalAchievements}
            </TrendIndicator>
          </StatItem>
          
          <StatItem>
            <StatValue>{personalStats.completionRate}%</StatValue>
            <StatLabel>Completion Rate</StatLabel>
            <TrendIndicator trend={personalStats.completionRate >= 80 ? 'up' : personalStats.completionRate >= 60 ? 'neutral' : 'down'}>
              {personalStats.completionRate >= 80 ? '📈 Excellent' : personalStats.completionRate >= 60 ? '📊 Good' : '📉 Improve'}
            </TrendIndicator>
          </StatItem>
          
          <StatItem>
            <StatValue>{personalStats.currentStreak}</StatValue>
            <StatLabel>Current Streak</StatLabel>
            <TrendIndicator>
              Best: {personalStats.bestStreak} days
            </TrendIndicator>
          </StatItem>
          
          <StatItem>
            <StatValue>{personalStats.avgSessionLength}</StatValue>
            <StatLabel>Avg Session (min)</StatLabel>
            <TrendIndicator trend={personalStats.avgSessionLength >= 20 ? 'up' : 'neutral'}>
              {personalStats.avgSessionLength >= 20 ? '🎯 Focused' : '⏰ Building'}
            </TrendIndicator>
          </StatItem>
          
          <StatItem>
            <StatValue>{personalStats.weeklyProgress}%</StatValue>
            <StatLabel>Weekly Goal</StatLabel>
            <TrendIndicator trend={personalStats.weeklyProgress >= 100 ? 'up' : personalStats.weeklyProgress >= 75 ? 'neutral' : 'down'}>
              {personalStats.weeklyProgress >= 100 ? '✅ Achieved' : personalStats.weeklyProgress >= 75 ? '🎯 Close' : '💪 Push'}
            </TrendIndicator>
          </StatItem>
          
          <StatItem>
            <StatValue>{personalStats.monthlyMinutes}</StatValue>
            <StatLabel>Monthly Minutes</StatLabel>
            <TrendIndicator trend={personalStats.monthlyMinutes >= 500 ? 'up' : 'neutral'}>
              {personalStats.monthlyMinutes >= 500 ? '🔥 Active' : '📈 Growing'}
            </TrendIndicator>
          </StatItem>
        </StatsGrid>
      </StatsOverview>

      <SectionTitle>Achievement Badges</SectionTitle>
      
      <AchievementGrid>
        {achievements.map(achievement => (
          <AchievementCard key={achievement.id} unlocked={achievement.unlocked}>
            {achievement.unlocked && <UnlockedBadge>Unlocked</UnlockedBadge>}
            
            <BadgeIcon unlocked={achievement.unlocked}>
              {achievement.icon}
            </BadgeIcon>
            
            <BadgeTitle unlocked={achievement.unlocked}>
              {achievement.title}
            </BadgeTitle>
            
            <BadgeDescription>
              {achievement.description}
            </BadgeDescription>
            
            <ProgressBar>
              <ProgressFill 
                progress={achievement.progressPercentage} 
                complete={achievement.unlocked}
              />
            </ProgressBar>
            
            <ProgressText>
              {achievement.progress} / {achievement.maxProgress}
              {achievement.unlocked && ' ✓'}
            </ProgressText>
          </AchievementCard>
        ))}
      </AchievementGrid>
    </AchievementsContainer>
  );
}