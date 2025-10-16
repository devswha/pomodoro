'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';
import { FallbackSignupForm } from './fallback/FallbackSignupForm';
import { useSignupForm } from '../../hooks/useSignupForm';

const Form = styled.form`
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
  border: 2px solid ${props => props.$error ? '#dc3545' : '#e9ecef'};
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
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #000000;
  color: #ffffff;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #333333;
  }

  &:disabled {
    background: #adb5bd;
    cursor: not-allowed;
  }
`;

const HelperText = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
`;

const PasswordStrengthBar = styled.div`
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;

  div {
    height: 100%;
    transition: width 0.3s ease, background 0.3s ease;

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
`;

const PasswordRequirements = styled.ul`
  margin: 0;
  padding-left: 1rem;
  font-size: 0.75rem;
  color: #6c757d;

  li {
    margin-bottom: 0.25rem;
    &.valid {
      color: #28a745;
    }
    &.invalid {
      color: #dc3545;
    }
  }
`;

export function SignupForm({ mode, onModeChange }) {
  const router = useRouter();
  const { registerUser, authLoading, currentUser } = useUser();
  const {
    formData,
    errors,
    passwordStrength,
    isChecking,
    handleChange,
    validateForm
  } = useSignupForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (mode === 'login') {
    return <FallbackSignupForm onModeChange={onModeChange} />;
  }

  if (authLoading) {
    return <HelperText>Loading...</HelperText>;
  }

  if (!authLoading && currentUser) {
    router.push('/main');
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!(await validateForm())) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser(formData.username.trim(), {
        displayName: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      setSubmitError('');
      router.push('/login');
    } catch (error) {
      console.error(error);
      setSubmitError(error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup>
        <InputLabel>사용자명</InputLabel>
        <InputField
          type="text"
          value={formData.username}
          onChange={(event) => handleChange('username', event.target.value)}
          placeholder="사용자명 입력 (4-20자)"
          $error={errors.username}
          autoComplete="username"
        />
    {isChecking.username && !errors.username && <HelperText>사용자명 확인 중...</HelperText>}
    {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <InputLabel>이메일</InputLabel>
        <InputField
          type="email"
          value={formData.email}
          onChange={(event) => handleChange('email', event.target.value)}
          placeholder="이메일 주소 입력"
          $error={errors.email}
          autoComplete="email"
        />
        {isChecking.email && <HelperText>이메일 확인 중...</HelperText>}
        {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <InputLabel>비밀번호</InputLabel>
        <InputField
          type="password"
          value={formData.password}
          onChange={(event) => handleChange('password', event.target.value)}
          placeholder="비밀번호 입력"
          $error={errors.password}
          autoComplete="new-password"
        />
        {passwordStrength && (
          <>
            <PasswordStrengthBar>
              <div className={passwordStrength.level} />
            </PasswordStrengthBar>
            <HelperText>{passwordStrength.message}</HelperText>
            <PasswordRequirements>
              {passwordStrength.requirements.map(req => (
                <li key={req.label} className={req.met ? 'valid' : 'invalid'}>
                  {req.label}
                </li>
              ))}
            </PasswordRequirements>
          </>
        )}
        {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
      </InputGroup>

      <InputGroup>
        <InputLabel>비밀번호 확인</InputLabel>
        <InputField
          type="password"
          value={formData.confirmPassword}
          onChange={(event) => handleChange('confirmPassword', event.target.value)}
          placeholder="비밀번호 다시 입력"
          $error={errors.confirmPassword}
          autoComplete="new-password"
        />
        {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
      </InputGroup>

      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? '가입 중...' : '회원가입'}
      </SubmitButton>
      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
    </Form>
  );
}

