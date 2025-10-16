'use client';

import React from 'react';
import styled from 'styled-components';

const HeaderSection = styled.div`
  margin-bottom: 3rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.5rem;
  @media (min-width: 769px) {
    font-size: 2.5rem;
  }
`;

const PageSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
`;

export function SignupHeader({ mode }) {
  const isLogin = mode === 'login';
  return (
    <HeaderSection>
      <PageTitle>{isLogin ? '로그인' : '회원가입'}</PageTitle>
      <PageSubtitle>
        {isLogin ? '다시 돌아오신 것을 환영합니다' : '새 계정을 만들어보세요'}
      </PageSubtitle>
    </HeaderSection>
  );
}

