import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  calendar: any | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  calendar: null,
  loading: true,
  checkAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('Checking auth status...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('Auth response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('Auth data:', data);

      if (response.ok && data.authenticated) {
        console.log('Setting authenticated state:', {
          user: data.user,
          calendar: data.calendar
        });
        setIsAuthenticated(true);
        setUser(data.user);
        setCalendar(data.calendar);
      } else {
        console.log('Setting unauthenticated state');
        setIsAuthenticated(false);
        setUser(null);
        setCalendar(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      setCalendar(null);
    } finally {
      setLoading(false);
    }
  };

  // Check auth on mount and when cookies change
  useEffect(() => {
    checkAuth();

    // Watch for cookie changes
    const cookieCheck = setInterval(() => {
      const hasAuthCookie = document.cookie.includes('access_token=');
      if (!hasAuthCookie && isAuthenticated) {
        console.log('Auth cookie lost, rechecking auth...');
        checkAuth();
      }
    }, 1000);

    return () => clearInterval(cookieCheck);
  }, []);

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    calendar,
    loading,
    checkAuth
  }), [isAuthenticated, user, calendar, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 