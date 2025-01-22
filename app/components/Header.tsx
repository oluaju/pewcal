"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export default function Header() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        setUserProfile(null);
        router.push('/');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        PewCal
      </Link>
      
      <div className={styles.userSection}>
        {loading ? (
          <div>Loading...</div>
        ) : userProfile ? (
          <>
            <button 
              className={styles.profileButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {userProfile.picture ? (
                <img 
                  src={userProfile.picture} 
                  alt={userProfile.name} 
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {getInitials(userProfile.name)}
                </div>
              )}
              <span className={styles.userName}>{userProfile.name}</span>
            </button>

            {showDropdown && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <strong>{userProfile.name}</strong>
                  <div className={styles.email}>{userProfile.email}</div>
                </div>
                <div className={styles.dropdownDivider} />
                <button 
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </>
        ) : (
          <Link href="/api/auth/login" className={styles.loginButton}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
} 