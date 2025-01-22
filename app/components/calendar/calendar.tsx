"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View, NavigateAction, Components, EventWrapperProps } from 'react-big-calendar';
import { format as dateFnsFormat, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, setHours, setMinutes, isSameDay, startOfMonth } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './calendar.module.css';
import { useMediaQuery } from '@/app/hooks/useMediaQuery';
import { useRouter } from 'next/navigation';
import { UserCircle, Menu, Plus, Calendar as CalendarIcon, CalendarRange, Clock, List, ChevronDown } from 'lucide-react';
import CalendarSelector from './CalendarSelector';
import { useQueryClient } from '@tanstack/react-query';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format: dateFnsFormat,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color?: string;
}

const views: View[] = ['month', 'week', 'day', 'agenda'];

interface CalendarProps {
  churchId: string;
}

interface ChatResponse {
  message: string;
  calendarUpdated?: boolean;
  error?: string;
  needsAuth?: boolean;
  authUrl?: string;
}

const Calendar = ({ churchId }: CalendarProps) => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [view, setView] = useState<View>(isMobile ? 'day' : 'month');
  const [date, setDate] = useState(new Date());
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const queryClient = useQueryClient();

  // Check auth status first
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Only fetch events if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
      // Fetch events every 5 minutes instead of every minute to reduce API calls
      const interval = setInterval(fetchEvents, 300000);
      
      // Listen for calendar changes
      const handleCalendarChange = () => {
        console.log('Calendar changed, fetching new events...');
        fetchEvents();
      };
      
      window.addEventListener('calendarChange', handleCalendarChange);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('calendarChange', handleCalendarChange);
      };
    }
  }, [date, view, churchId, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/calendar/events`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      // Handle both array and object response formats
      const eventsArray = Array.isArray(data) ? data : data.events || [];
      
      const formattedEvents: CalendarEvent[] = eventsArray.map((event: any) => ({
        title: event.summary || 'Untitled Event',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description || '',
        color: event.colorId ? `#${event.colorId}` : '#0A84FF'
      }));
      
      // Sort events by start date
      formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (newDate: Date, viewType: View, action: NavigateAction) => {
    switch (action) {
      case 'PREV':
        switch (view) {
          case 'month':
            setDate(subMonths(date, 1));
            break;
          case 'week':
            setDate(subWeeks(date, 1));
            break;
          case 'day':
            setDate(subDays(date, 1));
            break;
          default:
            setDate(subWeeks(date, 1));
        }
        break;
      case 'NEXT':
        switch (view) {
          case 'month':
            setDate(addMonths(date, 1));
            break;
          case 'week':
            setDate(addWeeks(date, 1));
            break;
          case 'day':
            setDate(addDays(date, 1));
            break;
          default:
            setDate(addWeeks(date, 1));
        }
        break;
      case 'TODAY':
        setDate(new Date());
        break;
      default:
        setDate(new Date());
    }
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleGoogleAuth = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error initiating Google auth:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // First clear all cookies and cache
      await fetch('/api/auth/cleanup', {
        method: 'POST'
      });

      // Then call sign-out endpoint and follow the redirect
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        redirect: 'follow'
      });

      // Clear React Query cache
      queryClient.clear();

      // The response will be a redirect, so we'll get the URL and navigate to it
      if (response.redirected) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Adjust time bounds to show more hours
  const minTime = setHours(setMinutes(new Date(), 0), 7); // Start at 7 AM
  const maxTime = setHours(setMinutes(new Date(), 0), 23); // End at 11 PM
  const scrollTime = setHours(setMinutes(new Date(), 0), 9); // Scroll to 9 AM

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return dateFnsFormat(date, 'MMMM yyyy');
      case 'week':
        return `Week of ${dateFnsFormat(date, 'MMM d, yyyy')}`;
      case 'day':
        return dateFnsFormat(date, 'EEEE, MMMM d');
      default:
        return dateFnsFormat(date, 'MMMM yyyy');
    }
  };

  const customDayPropGetter = (date: Date) => {
    const isToday = isSameDay(date, new Date());
    return {
      className: isToday ? styles.todayCell : '',
      style: {
        backgroundColor: 'transparent',
      }
    };
  };

  const components: Components<CalendarEvent> = {
    toolbar: () => null,
    event: (props: { event: CalendarEvent }) => (
      <div
        className={styles.eventWrapper}
        style={{ 
          backgroundColor: props.event.color || '#0A84FF',
          fontSize: '11px',
          padding: '1px 4px',
          color: '#fff',
          borderRadius: '2px',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {props.event.title}
      </div>
    ),
    dateCellWrapper: ({ children }) => (
      <div>
        <span>{children}</span>
      </div>
    ),
  };

  const handleChatResponse = async (response: Response) => {
    const data: ChatResponse = await response.json();
    
    if (response.ok) {
      // If the calendar was updated, refresh events
      if (data.calendarUpdated) {
        console.log('Calendar updated, refreshing events...');
        await fetchEvents();
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('calendarChange'));
      }
      
      // Handle auth redirect if needed
      if (data.needsAuth && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
    } else if (response.status === 401 && data.authUrl) {
      window.location.href = data.authUrl;
    }
  };

  const getNextMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = addMonths(new Date(), i);
      months.push({
        date,
        label: dateFnsFormat(date, 'MMMM yyyy')
      });
    }
    return months;
  };

  if (isAuthenticated === null) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={fetchEvents} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className={styles.authContainer}>
        <button onClick={handleGoogleAuth} className={styles.authButton}>
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <button 
                className={styles.menuButton}
                onClick={() => setShowMenu(!showMenu)}
              >
                <Menu size={24} />
              </button>
              <button 
                className={styles.monthSelector}
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              >
                {dateFnsFormat(date, 'MMMM yyyy')}
                <ChevronDown size={16} />
              </button>
              {showMonthDropdown && (
                <div className={styles.monthDropdown}>
                  {getNextMonths().map(({ date: monthDate, label }) => (
                    <button
                      key={label}
                      className={`${styles.monthOption} ${
                        dateFnsFormat(date, 'MMMM yyyy') === label ? styles.activeMonth : ''
                      }`}
                      onClick={() => {
                        setDate(startOfMonth(monthDate));
                        setView('month');
                        setShowMonthDropdown(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.headerRight}>
              <button 
                className={styles.profileButton}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <UserCircle size={24} />
              </button>
              {showProfileMenu && (
                <div className={styles.profileMenu}>
                  <button 
                    className={styles.signOutButton}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showMenu && (
          <div className={styles.menuOverlay} onClick={(e) => {
            if (e.target === e.currentTarget) setShowMenu(false);
          }}>
            <div className={styles.menu}>
              <div className={styles.menuHeader}>
                <h3>PewPal</h3>
              </div>
              <div className={styles.menuContent}>
                <div className={styles.menuItems}>
                  {[
                    { view: 'day', icon: <Clock size={20} />, label: 'Day' },
                    { view: 'week', icon: <CalendarRange size={20} />, label: 'Week' },
                    { view: 'month', icon: <CalendarIcon size={20} />, label: 'Month' },
                    { view: 'agenda', icon: <List size={20} />, label: 'Agenda' }
                  ].map(({ view: viewOption, icon, label }) => (
                    <button
                      key={viewOption}
                      onClick={() => {
                        handleViewChange(viewOption as View);
                        setShowMenu(false);
                      }}
                      className={`${styles.menuItem} ${view === viewOption ? styles.activeView : ''}`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
                <div className={styles.menuDivider} />
                <CalendarSelector />
              </div>
            </div>
          </div>
        )}

        <div className={styles.calendarContainer}>
          <div className={styles.calendar}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              views={views}
              components={components}
              dayPropGetter={customDayPropGetter}
              formats={{
                dateFormat: (date: Date) => dateFnsFormat(date, 'd'),
                dayFormat: (date: Date) => dateFnsFormat(date, 'd'),
                monthHeaderFormat: (date: Date) => dateFnsFormat(date, 'MMMM yyyy'),
                weekdayFormat: (date: Date) => dateFnsFormat(date, 'EEE').toUpperCase(),
              }}
              popup={true}
              popupOffset={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 