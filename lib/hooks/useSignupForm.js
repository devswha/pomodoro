'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { signupFormValidators } from '../services/signup/signupFormValidators';

const initialState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
};

export function useSignupForm() {
  const { validateUsername, validateEmail, checkPasswordStrength, userManager } = useUser();
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState({ username: false, email: false });

  const passwordStrength = useMemo(() => {
    if (!formData.password) return null;
    const base = checkPasswordStrength(formData.password);
    return {
      ...base,
      requirements: signupFormValidators.passwordRequirements.map(req => ({
        label: req.label,
        met: req.check(formData.password)
      })),
      level: base.score >= 3 ? 'strong' : base.score === 2 ? 'medium' : 'weak',
      message: base.feedback?.[0] || '비밀번호는 최소 6자 이상이어야 합니다.'
    };
  }, [formData.password, checkPasswordStrength]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    const clearError = (key) => setErrors(prev => ({ ...prev, [key]: undefined }));
    const setError = (key, message) => setErrors(prev => ({ ...prev, [key]: message }));

    if (field === 'username') {
      setIsChecking(prev => ({ ...prev, username: true }));

      const validation = validateUsername(value);
      try {
        if (!validation.isValid) {
          setError('username', validation.error);
        } else {
          const normalized = validation.normalizedUsername;

          if (!userManager.isUsernameUnique(normalized)) {
            setError('username', '이미 사용 중인 사용자명입니다.');
          } else {
            clearError('username');
          }
        }
      } catch (error) {
        console.error('Username validation error:', error);
        setError('username', '사용자명 확인 중 오류가 발생했습니다.');
      } finally {
        setIsChecking(prev => ({ ...prev, username: false }));
      }
    }

    if (field === 'email') {
      setIsChecking(prev => ({ ...prev, email: true }));

      try {
        const validation = validateEmail(value);
        if (!validation.isValid) {
          setError('email', validation.error);
        } else {
          const normalizedEmail = validation.normalizedEmail;

          if (!userManager.isEmailUnique(normalizedEmail)) {
            setError('email', '이미 사용 중인 이메일 주소입니다.');
          } else {
            clearError('email');
          }
        }
      } catch (error) {
        console.error('Email validation error:', error);
        setError('email', '이메일 확인 중 오류가 발생했습니다.');
      } finally {
        setIsChecking(prev => ({ ...prev, email: false }));
      }
    }

    if (field !== 'username' && field !== 'email' && errors[field]) {
      clearError(field);
    }

    if (field === 'confirmPassword' || (field === 'password' && formData.confirmPassword)) {
      if (field === 'confirmPassword' ? value !== formData.password : formData.confirmPassword && formData.confirmPassword !== value) {
        setError('confirmPassword', '비밀번호가 일치하지 않습니다.');
      } else {
        clearError('confirmPassword');
      }
    }
  }, [errors, validateUsername, validateEmail, userManager, formData.password, formData.confirmPassword]);

  const validateForm = useCallback(async () => {
    const newErrors = {};

    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error;
    } else if (!userManager.isUsernameUnique(usernameValidation.normalizedUsername)) {
      newErrors.username = '이미 사용 중인 사용자명입니다.';
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    } else if (!userManager.isEmailUnique(emailValidation.normalizedEmail)) {
      newErrors.email = '이미 사용 중인 이메일 주소입니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (!signupFormValidators.isPasswordValid(formData.password)) {
      newErrors.password = '비밀번호가 요구사항을 충족하지 않습니다.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateUsername, validateEmail, userManager]);

  return {
    formData,
    errors,
    isChecking,
    passwordStrength,
    handleChange,
    validateForm
  };
}

