'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (only on client side)
    const checkAuth = () => {
      try {
        const isLoggedIn = localStorage.getItem('userToken') || localStorage.getItem('isLoggedIn');

        if (isLoggedIn) {
          router.push('/main');
        } else {
          router.push('/login');
        }
      } catch (error) {
        // Fallback if localStorage is not available
        router.push('/login');
      }
    };

    // Small delay to ensure the static content renders first
    const timer = setTimeout(checkAuth, 100);

    return () => clearTimeout(timer);
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
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          LOGIN
        </button>
        <button
          onClick={() => router.push('/signup')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#000',
            border: '2px solid #000',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          SIGN UP
        </button>
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#6c757d',
        marginTop: '2rem'
      }}>
        Access your workspace with real-time sync across all devices
      </div>
    </div>
  );
}