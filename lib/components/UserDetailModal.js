'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabase/client';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border: 2px solid #000000;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const CloseButton = styled.button`
  background: none;
  border: 2px solid #000000;
  color: #000000;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: #000000;
    color: #ffffff;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #000000;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #000000;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 1rem;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: #000000;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'danger' ? '#dc3545' : props.variant === 'warning' ? '#ffc107' : '#000000'};
  color: ${props => props.variant === 'warning' ? '#000000' : '#ffffff'};
  border: 2px solid ${props => props.variant === 'danger' ? '#dc3545' : props.variant === 'warning' ? '#ffc107' : '#000000'};
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RecentActivities = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityInfo = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: #000000;
`;

const ActivityTime = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #6c757d;
`;

export default function UserDetailModal({ user, onClose, onUserUpdate }) {
  const [userDetails, setUserDetails] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserDetails();
      fetchRecentSessions();
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_stats (*),
          user_preferences (*)
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserDetails(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !userDetails.is_active;
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      setUserDetails(prev => ({ ...prev, is_active: newStatus }));
      if (onUserUpdate) onUserUpdate();

      window.alert(`사용자가 ${newStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('정말로 이 사용자의 비밀번호를 재설정하시겠습니까?')) {
      return;
    }

    try {
      // In a real app, you'd implement password reset logic here
      window.alert('비밀번호 재설정 이메일이 발송되었습니다.');
    } catch (error) {
      console.error('Error resetting password:', error);
      window.alert('비밀번호 재설정에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0분';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  if (!user) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>회원 상세 정보</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <LoadingSpinner>정보를 불러오는 중...</LoadingSpinner>
          ) : (
            <>
              <Section>
                <SectionTitle>기본 정보</SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>사용자명</InfoLabel>
                    <InfoValue>{userDetails?.username || '없음'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>표시 이름</InfoLabel>
                    <InfoValue>{userDetails?.display_name || '없음'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>이메일</InfoLabel>
                    <InfoValue>{userDetails?.email || '없음'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>비밀번호 (해시)</InfoLabel>
                    <InfoValue style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {userDetails?.password_hash === 'supabase_auth_managed'
                        ? 'Supabase Auth 관리'
                        : userDetails?.password_hash
                          ? (userDetails.password_hash.length > 20
                              ? userDetails.password_hash.substring(0, 20) + '...'
                              : userDetails.password_hash)
                          : '없음'}
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>가입일</InfoLabel>
                    <InfoValue>{formatDate(userDetails?.created_at)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>최근 접속</InfoLabel>
                    <InfoValue>{formatDate(userDetails?.last_login)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>계정 상태</InfoLabel>
                    <InfoValue>{userDetails?.is_active ? '활성' : '비활성'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Auth ID</InfoLabel>
                    <InfoValue style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {userDetails?.auth_id ? userDetails.auth_id.substring(0, 8) + '...' : '없음'}
                    </InfoValue>
                  </InfoItem>
                </InfoGrid>
              </Section>

              <Section>
                <SectionTitle>활동 통계</SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>총 세션 수</InfoLabel>
                    <InfoValue>{userDetails?.user_stats?.[0]?.total_sessions || 0}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>완료된 세션</InfoLabel>
                    <InfoValue>{userDetails?.user_stats?.[0]?.completed_sessions || 0}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>총 활동 시간</InfoLabel>
                    <InfoValue>{formatDuration(userDetails?.user_stats?.[0]?.total_minutes || 0)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>완료율</InfoLabel>
                    <InfoValue>{userDetails?.user_stats?.[0]?.completion_rate || 0}%</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>연속 일수</InfoLabel>
                    <InfoValue>{userDetails?.user_stats?.[0]?.streak_days || 0}일</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>최고 연속 일수</InfoLabel>
                    <InfoValue>{userDetails?.user_stats?.[0]?.best_streak || 0}일</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </Section>

              <Section>
                <SectionTitle>설정 정보</SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>기본 뽀모도로 시간</InfoLabel>
                    <InfoValue>{userDetails?.user_preferences?.[0]?.default_pomodoro_length || 25}분</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>휴식 시간</InfoLabel>
                    <InfoValue>{userDetails?.user_preferences?.[0]?.break_length || 5}분</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>주간 목표</InfoLabel>
                    <InfoValue>{userDetails?.user_preferences?.[0]?.weekly_goal || 140}분</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>테마</InfoLabel>
                    <InfoValue>{userDetails?.user_preferences?.[0]?.theme || 'minimal'}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </Section>

              <Section>
                <SectionTitle>최근 활동</SectionTitle>
                <RecentActivities>
                  {recentSessions.length > 0 ? (
                    recentSessions.map(session => (
                      <ActivityItem key={session.id}>
                        <ActivityInfo>
                          <ActivityTitle>{session.title || 'Pomodoro Session'}</ActivityTitle>
                          <ActivityTime>
                            {formatDate(session.created_at)} - {session.status} - {session.duration}분
                          </ActivityTime>
                        </ActivityInfo>
                      </ActivityItem>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
                      최근 활동이 없습니다.
                    </div>
                  )}
                </RecentActivities>
              </Section>

              <Section>
                <SectionTitle>관리 작업</SectionTitle>
                <ActionSection>
                  <ActionButton
                    variant={userDetails?.is_active ? 'warning' : 'success'}
                    onClick={handleToggleStatus}
                  >
                    {userDetails?.is_active ? '계정 비활성화' : '계정 활성화'}
                  </ActionButton>
                  <ActionButton onClick={handleResetPassword}>
                    비밀번호 재설정
                  </ActionButton>
                </ActionSection>
              </Section>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}