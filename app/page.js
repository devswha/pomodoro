'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('userToken') || localStorage.getItem('isLoggedIn');

    if (isLoggedIn) {
      router.push('/main');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: '#000'
      }}>
        POMODORO TIMER
      </h1>
      <p style={{
        fontSize: '1.125rem',
        color: '#6c757d',
        marginBottom: '2rem',
        maxWidth: '600px'
      }}>
        Modern minimalist pomodoro timer with real-time sync, multi-device support, and collaborative features.
      </p>
      <div style={{
        fontSize: '1rem',
        color: '#6c757d'
      }}>
        Loading your workspace...
      </div>
    </div>
  );
}