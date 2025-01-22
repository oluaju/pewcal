'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CalendarSetup.module.css';

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export default function CalendarSetup() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const fetchCalendars = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching calendars...');
      
      const response = await fetch('/api/calendar/list');
      const data = await response.json();
      console.log('Calendar response:', { status: response.status, data });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to auth if token is expired or missing
          router.push('/api/auth/login');
          return;
        }
        throw new Error(data.error || `Failed to fetch calendars (${response.status})`);
      }

      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      if (data.length === 0) {
        console.log('No calendars found');
        setError('No calendars found in your Google account');
        setCalendars([]);
        return;
      }

      console.log(`Found ${data.length} calendars`);
      setCalendars(data);
      
      // Auto-select primary calendar if available
      const primary = data.find((cal: Calendar) => cal.primary);
      if (primary) {
        setSelectedCalendar(primary.id);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError(error instanceof Error ? error.message : 'Failed to load calendars');
      setCalendars([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleSubmit = async () => {
    if (!selectedCalendar) return;

    try {
      setLoading(true);
      setError('');
      
      const calendar = calendars.find(cal => cal.id === selectedCalendar);
      if (!calendar) {
        throw new Error('Selected calendar not found');
      }

      const response = await fetch('/api/calendar/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleCalendarId: calendar.id,
          name: calendar.summary
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup calendar');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error setting up calendar:', error);
      setError(error instanceof Error ? error.message : 'Failed to setup calendar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Select Your Calendar</h1>
        <p className={styles.loading}>Loading your calendars...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Failed to load calendars</h2>
          <p className={styles.errorMessage}>
            {error}
            <br />
            {error.includes('401') ? 
              'Your session has expired. Please sign in again.' :
              'Please check your connection and try again.'}
          </p>
          <button 
            onClick={error.includes('401') ? 
              () => router.push('/api/auth/login') : 
              fetchCalendars} 
            className={styles.retryButton}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {error.includes('401') ? 'Sign In' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select Your Calendar</h1>
      <p className={styles.subtitle}>
        Choose the Google Calendar you want to use with PewCal.
      </p>

      <div className={styles.calendarList}>
        {calendars.length === 0 ? (
          <div className={styles.noCalendars}>
            No calendars found in your Google account.
            Please make sure you have at least one calendar.
          </div>
        ) : (
          calendars.map((calendar) => (
            <div
              key={calendar.id}
              className={`${styles.calendarOption} ${
                selectedCalendar === calendar.id ? styles.selected : ''
              }`}
              onClick={() => setSelectedCalendar(calendar.id)}
            >
              <div className={styles.radio} />
              <div className={styles.calendarInfo}>
                <div className={styles.calendarName}>
                  {calendar.summary}
                  {calendar.primary && (
                    <span className={styles.primaryBadge}>Primary</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        className={styles.continueButton}
        onClick={handleSubmit}
        disabled={!selectedCalendar || loading}
      >
        {loading ? 'Setting up...' : 'Continue'}
      </button>
    </div>
  );
} 