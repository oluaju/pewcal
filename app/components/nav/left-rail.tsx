"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Plus, LogOut } from 'lucide-react';
import styles from './left-rail.module.css';

interface LeftRailProps {
  userName?: string;
  userImage?: string;
  onSignOut?: () => void;
}

export function LeftRail({ 
  userName = "Calendar User",
  userImage = "https://avatars.githubusercontent.com/u/1",
  onSignOut 
}: LeftRailProps) {
  const [showSignOut, setShowSignOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node) && showSignOut) {
        setShowSignOut(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSignOut]);

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <nav className={styles.rail}>
      <div className={styles.top}>
        <Link href="/calendar/default" className={styles.link}>
          <Calendar className={styles.icon} />
          <span>Calendar</span>
        </Link>
        <button className={styles.link}>
          <Plus className={styles.icon} />
          <span>Create Event</span>
        </button>
      </div>

      <div className={styles.profile} ref={profileRef}>
        <button 
          className={styles.profileButton}
          onClick={() => setShowSignOut(!showSignOut)}
        >
          <Image
            src={userImage}
            alt={userName}
            width={32}
            height={32}
            className={styles.avatar}
          />
          <span>{userName}</span>
        </button>

        {showSignOut && (
          <button 
            className={styles.signOutButton}
            onClick={handleSignOut}
          >
            <LogOut className={styles.icon} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  );
} 