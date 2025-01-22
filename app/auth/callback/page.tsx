"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The actual OAuth handling is done by the API route
    // This page just shows a loading state
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      console.error('Auth error:', error);
      router.push(`/?error=${error}`);
    }
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="loading-spinner"></div>
      <div>Processing authentication...</div>
    </div>
  );
} 