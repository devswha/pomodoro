'use client';

import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const FallbackWrapper = styled.div`
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 0;
  margin-bottom: 1.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: 2px solid #000000;
  background: #ffffff;
  color: #000000;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }
`;

export function FallbackSignupForm({ onModeChange }) {
  const router = useRouter();

  return (
    <>
      <FallbackWrapper>
        현재 로그인 상태입니다. 다른 계정을 생성하려면 로그아웃이 필요합니다.
      </FallbackWrapper>
      <ButtonGroup>
        <ActionButton type="button" onClick={() => router.push('/main')}>
          대시보드로 이동
        </ActionButton>
        <ActionButton type="button" onClick={() => onModeChange('signup')}>
          새 계정 만들기
        </ActionButton>
      </ButtonGroup>
    </>
  );
}

