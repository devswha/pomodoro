'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { signupFormValidators } from '../services/signup/signupFormValidators';

const initialState = {
  username: '',
  displayName: '',
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
      // Only validate format, uniqueness will be checked by API
      const validation = validateUsername(value);
      if (!validation.isValid) {
        setError('username', validation.error);
      } else {
        clearError('username');
      }
    }

    if (field === 'email') {
      // Only validate format, uniqueness will be checked by API
      const validation = validateEmail(value);
      if (!validation.isValid) {
        setError('email', validation.error);
      } else {
        clearError('email');
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

    if (!formData.displayName || formData.displayName.trim().length < 2) {
      newErrors.displayName = '사용자명은 최소 2자 이상이어야 합니다.';
    } else if (formData.displayName.trim().length > 30) {
      newErrors.displayName = '사용자명은 최대 30자까지 입력 가능합니다.';
    }

    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error;
    }
    // Removed localStorage uniqueness check - API will handle it

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    // Removed localStorage uniqueness check - API will handle it

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
  }, [formData, validateUsername, validateEmail]);

  return {
    formData,
    errors,
    isChecking,
    passwordStrength,
    handleChange,
    validateForm
  };
}

