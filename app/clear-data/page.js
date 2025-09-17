'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { UserManager } from '../../lib/services/UserManager';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 20px;
`;

const Card = styled.div`
  background: #fff;
  border: 2px solid #000;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #000;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const Button = styled.button`
  background: ${props => props.danger ? '#dc3545' : '#000'};
  color: #fff;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  margin: 10px;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  margin-top: 20px;
  padding: 12px;
  border: 2px solid ${props => props.success ? '#28a745' : '#dc3545'};
  color: ${props => props.success ? '#28a745' : '#dc3545'};
  background: ${props => props.success ? '#d4edda' : '#f8d7da'};
`;

export default function ClearDataPage() {
  const [userManager] = useState(() => new UserManager());
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleClearData = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('정말로 모든 사용자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsClearing(true);
    try {
      const success = userManager.clearAllData();
      if (success) {
        setMessage('모든 사용자 데이터가 성공적으로 삭제되었습니다.');
        setMessageType('success');
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage('데이터 삭제 중 오류가 발생했습니다.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('데이터 삭제 중 오류가 발생했습니다: ' + error.message);
      setMessageType('error');
    } finally {
      setIsClearing(false);
    }
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <Container>
      <Card>
        <Title>데이터 초기화</Title>
        <Description>
          모든 사용자 데이터, 뽀모도로 세션, 모임 일정을 삭제합니다.
          <br />
          이 작업은 되돌릴 수 없습니다.
        </Description>
        
        <Button 
          danger 
          onClick={handleClearData} 
          disabled={isClearing}
        >
          {isClearing ? '삭제 중...' : '모든 데이터 삭제'}
        </Button>
        
        <Button onClick={goToLogin}>
          로그인 페이지로 이동
        </Button>

        {message && (
          <Message success={messageType === 'success'}>
            {message}
          </Message>
        )}
      </Card>
    </Container>
  );
}