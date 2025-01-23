"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Calendar from '@/app/components/calendar/calendar';
import CalendarChat from '@/app/components/calendar/calendar-chat';
import styles from './calendar.module.css';
import { BiMessageRoundedDots } from 'react-icons/bi';
import { useMediaQuery } from '@/app/hooks/useMediaQuery';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default function CalendarPage({ params }: PageProps) {
  const router = useRouter();
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleEventUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Calendar key={refreshKey} churchId={params.id} />
      {isAuthenticated && (
        <>
          <button
            onClick={toggleChat}
            className={styles.chatButton}
            aria-label="Toggle chat"
          >
            <BiMessageRoundedDots size={24} />
          </button>
          <CalendarChat
            onEventUpdate={handleEventUpdate}
            churchId={params.id}
            onClose={toggleChat}
            isVisible={isChatOpen}
          />
        </>
      )}
    </div>
  );
} 