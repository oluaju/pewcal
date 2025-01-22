"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './setup.module.css';

interface Calendar {
  id: string;
  summary: string;
  primary?: boolean;
}

export default function CalendarSetup() {
  const router = useRouter();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/list');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // The API returns the calendars array directly
      const calendars = Array.isArray(data) ? data : [];
      setCalendars(calendars);
      
      // Auto-select primary calendar if available
      const primary = calendars.find((cal: Calendar) => cal.primary);
      if (primary) {
        setSelectedCalendar(primary.id);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError('Failed to load your calendars. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendar) return;

    try {
      setLoading(true);
      const response = await fetch('/api/calendar/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleCalendarId: selectedCalendar,
          name: calendars.find(cal => cal.id === selectedCalendar)?.summary
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      router.push(`/calendar/${data.id}`);
    } catch (error) {
      console.error('Error setting up calendar:', error);
      setError('Failed to set up calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Loading your calendars...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button onClick={fetchCalendars} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Select Your Calendar</h1>
      <p className={styles.description}>
        Choose the Google Calendar you want to use with PewCal.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.calendarList}>
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className={`${styles.calendarOption} ${
                selectedCalendar === calendar.id ? styles.selected : ''
              }`}
              onClick={() => setSelectedCalendar(calendar.id)}
            >
              <input
                type="radio"
                name="calendar"
                value={calendar.id}
                checked={selectedCalendar === calendar.id}
                onChange={(e) => setSelectedCalendar(e.target.value)}
                className={styles.radio}
              />
              <div className={styles.calendarInfo}>
                <span className={styles.calendarName}>{calendar.summary}</span>
                {calendar.primary && (
                  <span className={styles.primaryBadge}>Primary</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!selectedCalendar || loading}
        >
          {loading ? 'Setting up...' : 'Continue'}
        </button>
      </form>
    </div>
  );
} 