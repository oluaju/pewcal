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
  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && 
          buttonRef.current && 
          !chatRef.current.contains(event.target as Node) && 
          !buttonRef.current.contains(event.target as Node)) {
        setIsChatOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return null;
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : ''}`}>
      <div className={styles.calendarSection}>
        <Calendar key={refreshKey} churchId={params.id} />
      </div>
      {isAuthenticated && (
        <>
          <button 
            ref={buttonRef}
            className={`${styles.chatToggle} ${isChatOpen ? styles.active : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            aria-label="Toggle chat"
          >
            <BiMessageRoundedDots />
          </button>
          {isChatOpen && (
            <div 
              ref={chatRef}
              className={styles.chatSection}
            >
              <CalendarChat onEventUpdate={handleEventUpdate} churchId={params.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
} 