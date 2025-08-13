import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';

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

const SignupForm = styled.form`
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
  border: 2px solid ${props => {
    if (props.error) return '#dc3545';
    return '#e9ecef';
  }};
  border-radius: 0;
  font-size: 1rem;
  color: #000000;
  background: #ffffff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #000000;
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const SubmitButton = styled.button`
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

const LoginLink = styled.div`
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

function SignupPage() {
  const navigate = useNavigate();
  const { loginUser } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요.';
    } else if (formData.username.length < 4 || formData.username.length > 20) {
      newErrors.username = '아이디는 4-20자여야 합니다.';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = '아이디는 영문과 숫자만 가능합니다.';
    }

    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 4) {
      newErrors.password = '비밀번호는 4자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Register and login user
      loginUser(formData.username, {
        displayName: formData.username
      });
      
      // Navigate to main page
      navigate('/main');
      
    } catch (error) {
      console.error('Signup failed:', error);
      setErrors({ general: '회원가입에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <SignupContainer>
      <BackButton onClick={handleBack}>← 뒤로</BackButton>
      
      <MainContent>
        <HeaderSection>
          <PageTitle>회원가입</PageTitle>
          <PageSubtitle>새 계정을 만들어보세요</PageSubtitle>
        </HeaderSection>

        <SignupForm onSubmit={handleSubmit}>
          <InputGroup>
            <InputLabel>아이디</InputLabel>
            <InputField
              type="text"
              placeholder="아이디 입력 (4-20자, 영문/숫자)"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              error={errors.username}
            />
            <ErrorMessage show={!!errors.username}>
              {errors.username}
            </ErrorMessage>
          </InputGroup>

          <InputGroup>
            <InputLabel>비밀번호</InputLabel>
            <InputField
              type="password"
              placeholder="비밀번호 입력 (4자 이상)"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />
            <ErrorMessage show={!!errors.password}>
              {errors.password}
            </ErrorMessage>
          </InputGroup>

          <InputGroup>
            <InputLabel>비밀번호 확인</InputLabel>
            <InputField
              type="password"
              placeholder="비밀번호 다시 입력"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
            />
            <ErrorMessage show={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </ErrorMessage>
          </InputGroup>

          {errors.general && (
            <ErrorMessage show={true}>
              {errors.general}
            </ErrorMessage>
          )}

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </SubmitButton>
        </SignupForm>

        <LoginLink>
          이미 계정이 있나요?{' '}
          <button type="button" onClick={handleLoginClick}>
            로그인
          </button>
        </LoginLink>
      </MainContent>
    </SignupContainer>
  );
}

export default SignupPage;