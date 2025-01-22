"use client";

import { useState } from 'react';
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

      <div className={styles.profile}>
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