"use client";

import Link from 'next/link';
import styles from './nav.module.css';

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.link}>Home</Link>
      <Link href="/chat" className={styles.link}>Chat</Link>
      <Link href="/calendar" className={styles.link}>Calendar</Link>
    </nav>
  );
} 