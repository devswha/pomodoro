'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { SignupHeader } from './SignupHeader';
import { SignupForm } from './SignupForm';
import { SignupFooter } from './SignupFooter';

const SignupContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  position: relative;
  @media (min-width: 769px) {
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f8f9fa;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 4rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (min-width: 769px) {
    max-width: 450px;
    width: 100%;
    padding: 3rem;
    background: #ffffff;
    border: 1px solid #e9ecef;
    flex: none;
  }
  @media (min-width: 1200px) {
    max-width: 500px;
    padding: 4rem;
  }
`;

const BackButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 1.5rem;
  background: none;
  border: none;
  color: #000000;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 100;
  &:hover {
    opacity: 0.7;
  }
  @media (min-width: 769px) {
    top: 2rem;
    left: 2rem;
  }
`;

export default function SignupPageContainer() {
  const [mode, setMode] = useState('signup');
  const router = useRouter();

  return (
    <SignupContainer>
      <BackButton onClick={() => router.push('/login')}>← 뒤로</BackButton>
      <MainContent>
        <SignupHeader mode={mode} onModeChange={setMode} />
        <SignupForm mode={mode} onModeChange={setMode} />
        <SignupFooter mode={mode} onModeChange={setMode} />
      </MainContent>
    </SignupContainer>
  );
}

