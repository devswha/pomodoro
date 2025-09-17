'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../../../lib/contexts/UserContext';

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

const PasswordStrengthIndicator = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  .strength-bar {
    height: 4px;
    background: #e9ecef;
    border-radius: 2px;
    overflow: hidden;
    
    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      
      &.weak {
        width: 33%;
        background: #dc3545;
      }
      
      &.medium {
        width: 66%;
        background: #ffc107;
      }
      
      &.strong {
        width: 100%;
        background: #28a745;
      }
    }
  }
  
  .strength-text {
    font-size: 0.75rem;
    color: #6c757d;
    
    &.weak { color: #dc3545; }
    &.medium { color: #ffc107; }
    &.strong { color: #28a745; }
  }
`;

const RequirementsList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.75rem;
  color: #6c757d;
  
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    
    &.valid {
      color: #28a745;
    }
    
    &.invalid {
      color: #dc3545;
    }
    
    &::before {
      content: '•';
      width: 0.75rem;
      text-align: center;
    }
    
    &.valid::before {
      content: '✓';
      color: #28a745;
    }
    
    &.invalid::before {
      content: '✗';
      color: #dc3545;
    }
  }
`;

export default function SignupPage() {
  const router = useRouter();
  const { registerUser, currentUser, authLoading, checkPasswordStrength, validateEmail, validateUsername, userManager } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/main');
    }
  }, [currentUser, authLoading, router]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <SignupContainer>
        <MainContent>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner />
            Loading...
          </div>
        </MainContent>
      </SignupContainer>
    );
  }

  const validateForm = async () => {
    const newErrors = {};

    // Enhanced username validation
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error;
    } else if (!userManager.isUsernameUnique(usernameValidation.normalizedUsername)) {
      newErrors.username = '이미 사용 중인 사용자명입니다.';
    }
    
    // Enhanced email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    } else if (!userManager.isEmailUnique(emailValidation.normalizedEmail)) {
      newErrors.email = '이미 사용 중인 이메일 주소입니다.';
    }

    // Enhanced password validation
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else {
      const passwordValidation = checkPasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = '비밀번호가 요구사항을 충족하지 않습니다: ' + passwordValidation.errors.join(', ');
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    // Update form data first
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time password strength validation
    if (field === 'password') {
      if (value) {
        const strength = checkPasswordStrength(value);
        setPasswordStrength(strength);
        setShowPasswordRequirements(true);
      } else {
        setPasswordStrength(null);
        setShowPasswordRequirements(false);
      }
      
      // Check password confirmation when password changes
      if (newFormData.confirmPassword && value !== newFormData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
      } else if (newFormData.confirmPassword && value === newFormData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    
    // Real-time username validation and uniqueness check (debounced)
    if (field === 'username' && value) {
      setIsCheckingUsername(true);
      setTimeout(() => {
        const usernameValidation = validateUsername(value);
        if (usernameValidation.isValid) {
          if (!userManager.isUsernameUnique(usernameValidation.normalizedUsername)) {
            setErrors(prev => ({ ...prev, username: '이미 사용 중인 사용자명입니다.' }));
          }
        } else if (value.length >= 1) {
          setErrors(prev => ({ ...prev, username: usernameValidation.error }));
        }
        setIsCheckingUsername(false);
      }, 500);
    }
    
    // Real-time email validation and uniqueness check
    if (field === 'email' && value) {
      setIsCheckingEmail(true);
      setTimeout(() => {
        const emailValidation = validateEmail(value);
        if (emailValidation.isValid) {
          if (!userManager.isEmailUnique(emailValidation.normalizedEmail)) {
            setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일 주소입니다.' }));
          }
        } else if (value.includes('@')) {
          setErrors(prev => ({ ...prev, email: emailValidation.error }));
        }
        setIsCheckingEmail(false);
      }, 500);
    }
    
    // Real-time password confirmation check
    if (field === 'confirmPassword') {
      if (value && newFormData.password && value !== newFormData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
      } else if (value && newFormData.password && value === newFormData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
      return;
    }

    setIsLoading(true);

    try {
      // Register user with enhanced data
      await registerUser(formData.username.trim(), {
        displayName: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      
      // Navigate to login page after successful registration
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      router.push('/login');
      
    } catch (error) {
      setErrors({ general: error.message || '회원가입에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/login');
  };

  const handleLoginClick = () => {
    router.push('/login');
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
            <InputLabel>사용자명</InputLabel>
            <InputField
              type="text"
              placeholder="사용자명 입력 (4-20자, 영문/숫자/_)"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              error={errors.username}
              autoComplete="username"
            />
            {isCheckingUsername && (
              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                사용자명 확인 중...
              </div>
            )}
            <ErrorMessage show={!!errors.username}>
              {errors.username}
            </ErrorMessage>
          </InputGroup>
          
          <InputGroup>
            <InputLabel>이메일</InputLabel>
            <InputField
              type="email"
              placeholder="이메일 주소 입력"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            {isCheckingEmail && (
              <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                이메일 확인 중...
              </div>
            )}
            <ErrorMessage show={!!errors.email}>
              {errors.email}
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
              autoComplete="new-password"
            />
            {passwordStrength && (
              <PasswordStrengthIndicator>
                <div className="strength-bar">
                  <div className={`strength-fill ${passwordStrength.strength}`}></div>
                </div>
                <div className={`strength-text ${passwordStrength.strength}`}>
                  {passwordStrength.strength === 'weak' && '비밀번호 강도: 약함'}
                  {passwordStrength.strength === 'medium' && '비밀번호 강도: 보통'}
                  {passwordStrength.strength === 'strong' && '비밀번호 강도: 강함'}
                </div>
              </PasswordStrengthIndicator>
            )}
            {showPasswordRequirements && passwordStrength && (
              <RequirementsList>
                <li className={formData.password.length >= 4 ? 'valid' : 'invalid'}>
                  4자 이상
                </li>
              </RequirementsList>
            )}
            {passwordStrength && passwordStrength.warnings && passwordStrength.warnings.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: '#ffc107', marginTop: '0.5rem' }}>
                {passwordStrength.warnings.map((warning, index) => (
                  <div key={index}>⚠️ {warning}</div>
                ))}
              </div>
            )}
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
              autoComplete="new-password"
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
            {isLoading && <LoadingSpinner />}
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