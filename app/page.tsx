"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { FaGoogle } from 'react-icons/fa';

export default function Home() {
  const [hasExistingTokens, setHasExistingTokens] = useState(false);

  useEffect(() => {
    // Check if user has existing tokens by looking for refresh_token cookie
    setHasExistingTokens(document.cookie.includes('refresh_token='));
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Easy church scheduling <span className={styles.highlight}>ahead</span>
            </h1>
            <p className={styles.subtitle}>
              Join churches who easily manage their events with the #1 AI-powered church calendar tool.
            </p>
            <a href="/api/auth/login" className={styles.googleButton}>
              <FaGoogle /> {hasExistingTokens ? 'Sign in with Google' : 'Sign up with Google Calendar'}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
