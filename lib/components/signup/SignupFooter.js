'use client';

import React from 'react';
import styled from 'styled-components';

const FooterWrapper = styled.div`
  text-align: center;
  margin-top: 2rem;
  color: #6c757d;
  font-size: 0.875rem;

  button {
    background: none;
    border: none;
    color: #000000;
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;

    &:hover {
      opacity: 0.7;
    }
  }
`;

export function SignupFooter({ mode, onModeChange }) {
  if (mode === 'login') {
    return (
      <FooterWrapper>
        계정이 없나요?{' '}
        <button type="button" onClick={() => onModeChange('signup')}>
          회원가입
        </button>
      </FooterWrapper>
    );
  }

  return (
    <FooterWrapper>
      이미 계정이 있나요?{' '}
      <button type="button" onClick={() => onModeChange('login')}>
        로그인
      </button>
    </FooterWrapper>
  );
}

