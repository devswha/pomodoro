'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';
import { ADMIN_CONFIG, STORAGE_KEYS, API_ENDPOINTS } from '../../../lib/config';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const WelcomeSection = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 2rem;
`;

const WelcomeTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 0.5rem 0;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 1.5rem;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #000000;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatChange = styled.div`
  font-size: 0.875rem;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  margin-top: 0.5rem;
`;

const QuickActions = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #000000;
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const ActionButton = styled.button`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #000000;
    color: #ffffff;
    border-color: #000000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionIcon = styled.span`
  font-size: 1.5rem;
`;

const RecentActivity = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 2rem;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
`;

const ActivityIcon = styled.div`
  font-size: 1.25rem;
`;

const ActivityDetails = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  font-size: 0.875rem;
  color: #000000;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1rem;
  color: #6c757d;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  margin-bottom: 2rem;
`;

const PasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
`;

const PasswordBox = styled.div`
  background: #ffffff;
  border: 2px solid #000000;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
`;

const PasswordTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

const PasswordSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 2rem 0;
  text-align: center;
`;

const PasswordForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PasswordInput = styled.input`
  border: 2px solid #e9ecef;
  padding: 1rem;
  font-size: 1rem;
  background: #ffffff;
  color: #000000;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #000000;
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const PasswordButton = styled.button`
  background: #000000;
  border: 2px solid #000000;
  color: #ffffff;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #333333;
    border-color: #333333;
  }

  &:active {
    transform: translateY(2px);
  }
`;

const PasswordError = styled.div`
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: center;
`;

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    newUsersToday: 0,
    activeSessionsNow: 0,
    completionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [error, setError] = useState('');

  // Password protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // Check if already authenticated in this session
    const adminAuth = sessionStorage.getItem(STORAGE_KEYS.adminAuthenticated);
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_CONFIG.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEYS.adminAuthenticated, 'true');
      setPasswordError('');
      fetchDashboardData();
    } else {
      setPasswordError('비밀번호가 올바르지 않습니다');
      setPassword('');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get auth token
      const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

      // Fetch dashboard data from API
      const response = await fetch(API_ENDPOINTS.adminDashboard, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-token': token || ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentActivities(data.recentActivities);
      } else {
        throw new Error(data.error || 'Failed to load dashboard data');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSection = (path) => {
    router.push(path);
  };

  const executeAction = async (action) => {
    switch (action) {
      case 'export-users':
        // Export users to CSV
        const token = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
        const response = await fetch(API_ENDPOINTS.exportUsers, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-token': token || ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.users) {
            const csv = convertToCSV(data.users);
            downloadCSV(csv, 'users-export.csv');
          }
        }
        break;

      case 'backup-data':
        alert('Backup initiated. This feature is coming soon.');
        break;

      case 'clear-sessions':
        if (window.confirm('Are you sure you want to clear all inactive sessions?')) {
          // TODO: Implement API endpoint for clearing sessions
          alert('Clear sessions feature is temporarily disabled');
          // fetchDashboardData();
        }
        break;

      case 'send-notification':
        alert('Notification feature coming soon');
        break;

      default:
        break;
    }
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <PasswordContainer>
        <PasswordBox>
          <PasswordTitle>관리자 인증</PasswordTitle>
          <PasswordSubtitle>관리자 페이지에 접근하려면 비밀번호를 입력하세요</PasswordSubtitle>
          <PasswordForm onSubmit={handlePasswordSubmit}>
            {passwordError && <PasswordError>{passwordError}</PasswordError>}
            <PasswordInput
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <PasswordButton type="submit">
              확인
            </PasswordButton>
          </PasswordForm>
        </PasswordBox>
      </PasswordContainer>
    );
  }

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>Loading dashboard...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Welcome, Admin!</WelcomeTitle>
        <WelcomeSubtitle>
          Here's an overview of your STEP Timer application
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsGrid>
        <StatCard onClick={() => navigateToSection('/admin/users')}>
          <StatIcon>👥</StatIcon>
          <StatValue>{stats.totalUsers}</StatValue>
          <StatLabel>Total Users</StatLabel>
          <StatChange positive={stats.newUsersToday > 0}>
            +{stats.newUsersToday} today
          </StatChange>
        </StatCard>

        <StatCard onClick={() => navigateToSection('/admin/users')}>
          <StatIcon>🟢</StatIcon>
          <StatValue>{stats.activeUsers}</StatValue>
          <StatLabel>Active Users</StatLabel>
          <StatChange positive>Last 7 days</StatChange>
        </StatCard>

        <StatCard onClick={() => navigateToSection('/admin/analytics')}>
          <StatIcon>⏰</StatIcon>
          <StatValue>{stats.totalSessions}</StatValue>
          <StatLabel>Total Sessions</StatLabel>
          <StatChange positive={stats.activeSessionsNow > 0}>
            {stats.activeSessionsNow} active now
          </StatChange>
        </StatCard>

        <StatCard onClick={() => navigateToSection('/admin/analytics')}>
          <StatIcon>📊</StatIcon>
          <StatValue>{stats.completionRate}%</StatValue>
          <StatLabel>Completion Rate</StatLabel>
          <StatChange positive={stats.completionRate >= 70}>Overall</StatChange>
        </StatCard>
      </StatsGrid>

      <QuickActions>
        <SectionTitle>Quick Actions</SectionTitle>
        <ActionGrid>
          <ActionButton onClick={() => executeAction('export-users')}>
            <ActionIcon>📥</ActionIcon>
            Export Users
          </ActionButton>
          <ActionButton onClick={() => executeAction('backup-data')}>
            <ActionIcon>💾</ActionIcon>
            Backup Data
          </ActionButton>
          <ActionButton onClick={() => executeAction('clear-sessions')}>
            <ActionIcon>🗑️</ActionIcon>
            Clear Old Sessions
          </ActionButton>
          <ActionButton onClick={() => executeAction('send-notification')}>
            <ActionIcon>📢</ActionIcon>
            Send Notification
          </ActionButton>
        </ActionGrid>
      </QuickActions>

      <RecentActivity>
        <SectionTitle>Recent Activity</SectionTitle>
        <ActivityList>
          {recentActivities.length > 0 ? (
            recentActivities.map(activity => (
              <ActivityItem key={activity.id}>
                <ActivityIcon>{activity.icon}</ActivityIcon>
                <ActivityDetails>
                  <ActivityText>{activity.text}</ActivityText>
                  <ActivityTime>{activity.time}</ActivityTime>
                </ActivityDetails>
              </ActivityItem>
            ))
          ) : (
            <ActivityItem>
              <ActivityDetails>
                <ActivityText>No recent activity</ActivityText>
              </ActivityDetails>
            </ActivityItem>
          )}
        </ActivityList>
      </RecentActivity>
    </DashboardContainer>
  );
}
