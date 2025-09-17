'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useUser } from '../contexts/UserContext';

const LoadingContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #000000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-text {
    margin-top: 1rem;
    color: #6c757d;
    font-size: 0.875rem;
  }
`;

const AuthWrapper = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const router = useRouter();
  const { currentUser, authLoading, validateCurrentSession } = useUser();

  useEffect(() => {
    if (!authLoading) {
      if (requireAuth && !currentUser) {
        router.push(redirectTo);
      } else if (!requireAuth && currentUser) {
        router.push('/main');
      } else if (requireAuth && currentUser) {
        // Validate current session
        if (!validateCurrentSession()) {
          router.push(redirectTo);
        }
      }
    }
  }, [currentUser, authLoading, requireAuth, redirectTo, router, validateCurrentSession]);

  if (authLoading) {
    return (
      <LoadingContainer>
        <div className="spinner"></div>
        <div className="loading-text">Loading...</div>
      </LoadingContainer>
    );
  }

  // If requireAuth is true but no user, don't render children (redirect will happen)
  if (requireAuth && !currentUser) {
    return null;
  }

  // If requireAuth is false but user exists, don't render children (redirect will happen)
  if (!requireAuth && currentUser) {
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;