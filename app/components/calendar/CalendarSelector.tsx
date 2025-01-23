import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import styles from './CalendarSelector.module.css';

interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

interface CalendarSelectorProps {
  calendars: Calendar[];
  isLoading: boolean;
  selectedCalendar: string;
  onCalendarChange: (calendarId: string) => void;
}

export default function CalendarSelector({ 
  calendars, 
  isLoading, 
  selectedCalendar,
  onCalendarChange 
}: CalendarSelectorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

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

      // Notify parent of the change
      onCalendarChange(selectedCal.id);
      
      // Invalidate events query to refresh with new calendar
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error) {
      console.error('Error changing calendar:', error);
    }
  };

  if (isLoading) {
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

  if (!calendars || calendars.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Your Calendars</h3>
        <div className={styles.error}>
          No calendars found. Please make sure you have at least one Google Calendar.
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