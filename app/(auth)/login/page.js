'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';
import { APP_VERSION } from '../../../lib/config/version';

const LoginContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  position: relative;
  
  @media (min-width: 769px) {
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
`;

const VersionDisplay = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 400;
  z-index: 1000;
  
  @media (min-width: 769px) {
    top: 2rem;
    right: 2rem;
    font-size: 0.875rem;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
  
  @media (min-width: 769px) {
    max-width: 450px;
    width: 100%;
    padding: 3rem;
    gap: 3rem;
    flex: none;
  }
  
  @media (min-width: 1200px) {
    max-width: 500px;
    padding: 4rem;
    gap: 4rem;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
`;

const BrandTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 300;
  color: #000000;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
  
  @media (min-width: 769px) {
    font-size: 3rem;
  }
  
  @media (min-width: 1200px) {
    font-size: 3.5rem;
  }
`;

const BrandSubtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
  font-weight: 400;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InputField = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid ${props => props.error ? '#dc3545' : '#e9ecef'};
  border-radius: 0;
  font-size: 1rem;
  color: #000000;
  background: #ffffff;
  transition: border-color 0.2s ease;
  
  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background: #333333;
  }

  &:disabled {
    background: #adb5bd;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const SignupLink = styled.div`
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

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    margin: 0;
  }
  
  label {
    font-size: 0.875rem;
    color: #6c757d;
    margin: 0;
    cursor: pointer;
    text-transform: none;
    letter-spacing: normal;
  }
`;

const LoadingSpinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  display: inline-block;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, currentUser, authLoading, sessionWarning } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/main');
    }
  }, [currentUser, authLoading, router]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <LoginContainer>
        <VersionDisplay>v{APP_VERSION}</VersionDisplay>
        <MainContent>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner />
            Loading...
          </div>
        </MainContent>
      </LoginContainer>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = '로그인 ID를 입력해주세요.';
    }

    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Login with enhanced UserManager
      await loginUser(formData.username.trim(), formData.password, formData.rememberMe);
      
      // Navigate to main page
      router.push('/main');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    router.push('/signup');
  };

  return (
    <LoginContainer>
      <VersionDisplay>v{APP_VERSION}</VersionDisplay>

      <MainContent>
        <HeaderSection>
          <BrandTitle>STEP</BrandTitle>
          <BrandSubtitle>집중력 향상을 위한 시간 관리</BrandSubtitle>
        </HeaderSection>

        <FormSection>
          <LoginForm onSubmit={handleSubmit}>
            <InputGroup>
              <InputLabel htmlFor="username">로그인 ID</InputLabel>
              <InputField
                id="username"
                name="username"
                type="text"
                placeholder="로그인 ID 입력"
                value={formData.username}
                onChange={handleInputChange}
                error={fieldErrors.username}
                autoComplete="username"
              />
              <ErrorMessage show={!!fieldErrors.username}>{fieldErrors.username}</ErrorMessage>
            </InputGroup>

            <InputGroup>
              <InputLabel htmlFor="password">비밀번호</InputLabel>
              <InputField
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호 입력"
                value={formData.password}
                onChange={handleInputChange}
                error={fieldErrors.password}
                autoComplete="current-password"
              />
              <ErrorMessage show={!!fieldErrors.password}>{fieldErrors.password}</ErrorMessage>
            </InputGroup>
            
            <RememberMeContainer>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label htmlFor="rememberMe">로그인 상태 유지</label>
            </RememberMeContainer>
            
            {sessionWarning && (
              <ErrorMessage show={true} style={{ textAlign: 'center', marginTop: '1rem', color: '#ffc107' }}>
                {sessionWarning}
              </ErrorMessage>
            )}
            
            {error && (
              <ErrorMessage show={true} style={{ textAlign: 'center', marginTop: '1rem' }}>
                {error}
              </ErrorMessage>
            )}

            <LoginButton 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner />}
              {isLoading ? '로그인 중...' : '로그인'}
            </LoginButton>
          </LoginForm>

          <SignupLink>
            계정이 없나요?{' '}
            <button type="button" onClick={handleSignupClick}>
              회원가입
            </button>
          </SignupLink>
        </FormSection>
      </MainContent>
    </LoginContainer>
  );
}