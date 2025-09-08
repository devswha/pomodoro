'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';

export function ClientAuthWrapper({ children, requireAuth = false }) {
  const { currentUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, requireAuth, router]);

  // Show loading or redirect if auth is required but user not found
  if (requireAuth && !currentUser) {
    return <div>Loading...</div>;
  }

  return children;
}