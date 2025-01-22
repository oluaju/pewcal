"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Calendar from '@/app/components/calendar/calendar';
import CalendarChat from '@/app/components/calendar/calendar-chat';
import styles from './calendar-page.module.css';
import { BiMessageRoundedDots } from 'react-icons/bi'; // Changed to a cleaner icon
import { useMediaQuery } from '@/app/hooks/useMediaQuery';

export default function CalendarPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleEventUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleClose = useCallback(() => {
    console.log('Closing chat'); // Debug log
    setIsChatOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isMobile && chatRef.current && 
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
  }, [isMobile]);

  return (
    <div className={styles.container}>
      <div className={styles.calendarSection}>
        <Calendar key={refreshKey} churchId="default" />
      </div>
      {(!isMobile || !isChatOpen) && (
        <button 
          ref={buttonRef}
          className={`${styles.chatToggle} ${isChatOpen ? styles.active : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label="Toggle chat"
        >
          <BiMessageRoundedDots />
        </button>
      )}
      {isChatOpen && (
        <div 
          ref={chatRef}
          className={`${styles.chatSection} ${isChatOpen ? styles.open : ''}`}
        >
          <CalendarChat 
            churchId="default" 
            onEventUpdate={handleEventUpdate}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
} 