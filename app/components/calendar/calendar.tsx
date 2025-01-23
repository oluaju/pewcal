"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { useQuery } from '@tanstack/react-query';

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
  calendarColor?: string;
}

interface Calendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

interface CalendarSelectorProps {
  calendars: Calendar[];
  isLoading: boolean;
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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

const Calendar = ({ churchId }: CalendarProps) => {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<View>(isMobile ? 'day' : 'month');
  const [date, setDate] = useState(new Date());
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const queryClient = useQueryClient();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Get the selected calendar from the query cache
  const { data: selectedCalendar = '' } = useQuery({
    queryKey: ['selectedCalendar'],
    queryFn: async () => {
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

  // Use React Query for events with the selected calendar
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', date, view, selectedCalendar],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/events?calendarId=${selectedCalendar}`);
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      const eventsArray = Array.isArray(data) ? data : data.events || [];
      
      return eventsArray.map((event: any) => ({
        title: event.summary || 'Untitled Event',
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        description: event.description || '',
        color: event.colorId ? event.calendarColor : undefined,
        calendarColor: event.calendarColor
      })).sort((a: CalendarEvent, b: CalendarEvent) => a.start.getTime() - b.start.getTime());
    },
    enabled: isAuthenticated === true && !!selectedCalendar,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    refetchOnWindowFocus: false
  });

  // Add calendar query near the events query
  const { data: calendars = [], isLoading: calendarsLoading } = useQuery({
    queryKey: ['calendars'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/list');
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch calendars');
      }
      const data = await response.json();
      
      // If we have a selected calendar, mark it as selected in the list
      return data.map((cal: Calendar) => ({
        ...cal,
        selected: cal.id === selectedCalendar
      }));
    },
    enabled: isAuthenticated === true,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserProfile(data);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewChange = (newView: View) => {
    setView(newView);
    setIsViewMenuOpen(false);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(date);
    newDate.setMonth(month);
    setDate(newDate);
    setShowMonthDropdown(false);
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
          backgroundColor: props.event.color || props.event.calendarColor || '#0A84FF',
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
        queryClient.invalidateQueries({ queryKey: ['events'] });
        
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

  useEffect(() => {
    if (isAuthenticated) {
      // Only refetch events every 5 minutes
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }, 300000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isAuthenticated, queryClient]);

  if (isAuthenticated === null || eventsLoading) {
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
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })} 
          className={styles.retryButton}
        >
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
              <div className={styles.headerLogo}>
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
            </div>
            <div className={styles.headerRight} ref={profileMenuRef}>
              <button 
                className={styles.profileButton}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <UserCircle size={24} />
              </button>
              {showProfileMenu && userProfile && (
                <div className={styles.profileMenu}>
                  <div className={styles.profileHeader}>
                    <strong>{userProfile.name}</strong>
                    <div className={styles.profileEmail}>{userProfile.email}</div>
                  </div>
                  <div className={styles.menuDivider} />
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
                <button 
                  className={styles.menuButton}
                  onClick={() => setShowMenu(false)}
                >
                  <Menu size={24} />
                </button>
                <div className={styles.headerLogo}>
                  <h3>PewPal</h3>
                </div>
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
                <CalendarSelector 
                  calendars={calendars} 
                  isLoading={calendarsLoading}
                  selectedCalendar={selectedCalendar}
                  onCalendarChange={(calendarId) => {
                    queryClient.setQueryData(['selectedCalendar'], calendarId);
                  }}
                />
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