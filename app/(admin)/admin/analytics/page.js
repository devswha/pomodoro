'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { supabase } from '../../../../lib/supabase/client';

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
`;

const BackButton = styled.button`
  background: #ffffff;
  border: 2px solid #000000;
  color: #000000;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #000000;
    color: #ffffff;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 1.5rem;
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

const ChartSection = styled.div`
  background: #ffffff;
  border: 2px solid #e9ecef;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #000000;
  margin: 0 0 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border: 2px solid #e9ecef;
`;

const Th = styled.th`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.875rem;
`;

const Td = styled.td`
  border: 1px solid #e9ecef;
  padding: 1rem;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1rem;
  color: #6c757d;
`;

const ProgressBar = styled.div`
  background: #e9ecef;
  height: 20px;
  position: relative;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  background: #000000;
  height: 100%;
  width: ${props => props.percent}%;
  transition: width 0.3s ease;
`;

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalMinutes: 0,
    averageSessionLength: 0,
    completionRate: 0,
    topUsers: []
  });

  useEffect(() => {
    // Check admin authentication
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }

    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('pomodoro_sessions')
        .select('*');

      if (sessionsError) throw sessionsError;

      // Get top users by session count
      const { data: topUsers, error: topUsersError } = await supabase
        .from('pomodoro_sessions')
        .select('user_id, users(username, display_name)')
        .eq('status', 'completed');

      if (topUsersError) throw topUsersError;

      // Calculate statistics
      const totalSessions = sessions?.length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
      const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
      const averageSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      // Calculate top users
      const userSessionCounts = {};
      topUsers?.forEach(session => {
        const userId = session.user_id;
        if (!userSessionCounts[userId]) {
          userSessionCounts[userId] = {
            userId,
            username: session.users?.username || 'Unknown',
            displayName: session.users?.display_name || 'Unknown',
            count: 0
          };
        }
        userSessionCounts[userId].count++;
      });

      const topUsersList = Object.values(userSessionCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setAnalytics({
        totalSessions,
        completedSessions,
        totalMinutes,
        averageSessionLength,
        completionRate,
        topUsers: topUsersList
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading analytics...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>통계 및 분석</Title>
        <BackButton onClick={() => router.push('/admin')}>
          ← 돌아가기
        </BackButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{analytics.totalSessions}</StatValue>
          <StatLabel>전체 세션</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{analytics.completedSessions}</StatValue>
          <StatLabel>완료된 세션</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{analytics.totalMinutes}분</StatValue>
          <StatLabel>총 누적 시간</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{analytics.averageSessionLength}분</StatValue>
          <StatLabel>평균 세션 길이</StatLabel>
        </StatCard>
      </StatsGrid>

      <ChartSection>
        <SectionTitle>세션 완료율</SectionTitle>
        <ProgressBar>
          <ProgressFill percent={analytics.completionRate} />
        </ProgressBar>
        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
          {analytics.completionRate}%
        </div>
      </ChartSection>

      <ChartSection>
        <SectionTitle>상위 사용자 (완료 세션 기준)</SectionTitle>
        <Table>
          <thead>
            <tr>
              <Th>순위</Th>
              <Th>사용자</Th>
              <Th>이름</Th>
              <Th>완료 세션</Th>
            </tr>
          </thead>
          <tbody>
            {analytics.topUsers.map((user, index) => (
              <Tr key={user.userId}>
                <Td>{index + 1}</Td>
                <Td>{user.username}</Td>
                <Td>{user.displayName}</Td>
                <Td>{user.count}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {analytics.topUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            데이터가 없습니다
          </div>
        )}
      </ChartSection>
    </Container>
  );
}
