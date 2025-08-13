import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';

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

function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (formData.password.length < 4) {
      setError('비밀번호는 4자 이상 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Login with UserManager
      const user = loginUser(formData.username);
      
      // Navigate to main page
      navigate('/main');
      
    } catch (err) {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  return (
    <LoginContainer>
      <VersionDisplay>v4.0.0</VersionDisplay>
      
      <MainContent>
        <HeaderSection>
          <BrandTitle>POMODORO</BrandTitle>
          <BrandSubtitle>집중력 향상을 위한 시간 관리</BrandSubtitle>
        </HeaderSection>

        <FormSection>
          <LoginForm onSubmit={handleSubmit}>
            <InputGroup>
              <InputLabel htmlFor="username">아이디</InputLabel>
              <InputField
                id="username"
                name="username"
                type="text"
                placeholder="아이디 입력"
                value={formData.username}
                onChange={handleInputChange}
                error={error}
              />
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
                error={error}
              />
              <ErrorMessage show={!!error}>{error}</ErrorMessage>
            </InputGroup>

            <LoginButton 
              type="submit" 
              disabled={isLoading}
            >
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

export default LoginPage;