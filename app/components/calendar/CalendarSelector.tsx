import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import styles from './CalendarSelector.module.css';

interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export default function CalendarSelector() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading: authLoading, checkAuth, user } = useAuth();

  console.log('CalendarSelector render:', { 
    isAuthenticated, 
    authLoading,
    hasUser: !!user,
    cookies: document.cookie // Log cookies to see what's available
  });

  // Get the selected calendar from the query cache
  const { data: selectedCalendar = '', isLoading: isSelectedCalendarLoading } = useQuery({
    queryKey: ['selectedCalendar'],
    queryFn: () => {
      try {
        const cookies = document.cookie.split(';');
        const calendarCookie = cookies
          .find(cookie => cookie.trim().startsWith('google_calendar_id='));
        if (calendarCookie) {
          const encodedValue = calendarCookie.split('=')[1];
          return decodeURIComponent(encodedValue.trim());
        }
        return '';
      } catch (error) {
        console.error('Error parsing calendar cookie:', error);
        return '';
      }
    },
    staleTime: Infinity // Never consider this data stale
  });

  const { data: calendars = [], isLoading, error, refetch } = useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      console.log('Fetching calendars...', { 
        isAuthenticated, 
        authLoading,
        hasUser: !!user,
        cookies: document.cookie 
      });

      // Double check auth before making request
      if (!isAuthenticated || authLoading) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/calendar/list', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Calendar fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (response.status === 401) {
          console.log('Authentication check failed, rechecking auth status...');
          await checkAuth(); // Recheck auth status
          throw new Error('Authentication required');
        }
        throw new Error(data.error || `Failed to fetch calendars (${response.status})`);
      }

      const data = await response.json();
      console.log('Received calendars:', data);
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      if (data.length === 0) {
        console.log('No calendars returned from server');
      }

      return data;
    },
    enabled: isAuthenticated && !authLoading, // Only run query when authenticated
    retry: (failureCount, error) => {
      console.log('Retry attempt:', { failureCount, error });
      // Retry up to 3 times, but not for auth errors
      if (error.message === 'Authentication required' || error.message === 'Not authenticated') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    refetchOnWindowFocus: false
  });

  // Handle initial calendar selection
  useEffect(() => {
    if (calendars && calendars.length > 0 && !selectedCalendar) {
      // Auto-select primary calendar if available
      const primary = calendars.find(cal => cal.primary);
      const selectedId = primary?.id || calendars[0].id;
      
      console.log('Auto-selecting calendar:', selectedId);
      handleCalendarChange(selectedId);
    }
  }, [calendars, selectedCalendar]);

  const handleCalendarChange = async (calendarId: string) => {
    try {
      console.log('Changing calendar to:', calendarId);
      
      // Clear any existing calendar data from cache
      queryClient.removeQueries({ queryKey: ['selectedCalendar'] });
      queryClient.removeQueries({ queryKey: ['events'] });
      
      // Find the selected calendar to get its full details
      const selectedCal = calendars.find(cal => cal.id === calendarId);
      if (!selectedCal) {
        throw new Error('Selected calendar not found');
      }
      
      // Make a server request to update the calendar selection
      const response = await fetch('/api/calendar/select', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          calendarId: selectedCal.id,
          name: selectedCal.summary
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Failed to update calendar selection:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error('Failed to update calendar selection');
      }

      // Update the cache with new selection
      queryClient.setQueryData(['selectedCalendar'], selectedCal.id);
      
      // Notify parent components of calendar change
      const event = new CustomEvent('calendarChange', { 
        detail: { 
          calendarId: selectedCal.id,
          name: selectedCal.summary
        } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error changing calendar:', error);
      // Revert the optimistic update on error
      queryClient.setQueryData(['selectedCalendar'], selectedCalendar);
    }
  };

  if (isLoading || isSelectedCalendarLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Your Calendars</h3>
        <div className={styles.loadingList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.loadingItem}>
              <div className={styles.loadingRadio} />
              <div className={styles.loadingText} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Your Calendars</h3>
        <div className={styles.error}>
          {error instanceof Error ? error.message : 'Failed to load calendars'}
          <button onClick={() => refetch()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!calendars || calendars.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Your Calendars</h3>
        <div className={styles.error}>
          No calendars found. Please make sure you have at least one Google Calendar.
          <button onClick={() => refetch()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Your Calendars</h3>
      <div className={styles.calendarList}>
        {calendars.map((calendar) => (
          <div
            key={calendar.id}
            className={`${styles.calendarOption} ${
              selectedCalendar === calendar.id ? styles.selected : ''
            }`}
          >
            <input
              type="radio"
              name="calendar"
              value={calendar.id}
              checked={selectedCalendar === calendar.id}
              onChange={(e) => handleCalendarChange(e.target.value)}
              className={styles.radio}
              style={{
                accentColor: calendar.backgroundColor || '#1a73e8'
              }}
            />
            <div className={styles.calendarInfo}>
              <span 
                className={styles.calendarName}
                style={{
                  color: selectedCalendar === calendar.id ? calendar.backgroundColor : undefined
                }}
              >
                {calendar.summary}
                {calendar.accessRole && calendar.accessRole !== 'owner' && (
                  <span className={styles.accessRole}>
                    ({calendar.accessRole})
                  </span>
                )}
              </span>
              {calendar.primary && (
                <span 
                  className={styles.primaryBadge}
                  style={{
                    color: calendar.backgroundColor || '#1a73e8'
                  }}
                >
                  Primary
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 