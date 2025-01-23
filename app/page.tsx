"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { FaGoogle } from 'react-icons/fa';
import Link from 'next/link';
import { Calendar, MessageSquare, Clock } from 'lucide-react';

export default function Home() {
  const [hasExistingTokens, setHasExistingTokens] = useState(false);

  useEffect(() => {
    // Check if user has existing tokens by looking for refresh_token cookie
    setHasExistingTokens(document.cookie.includes('refresh_token='));
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            PewPal
          </Link>
          <a href={process.env.NEXT_PUBLIC_AUTH_URL} className={styles.loginButton}>
            {hasExistingTokens ? 'Sign in' : 'Get Started'}
          </a>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Easy church scheduling <span className={styles.highlight}>ahead</span>
            </h1>
            <p className={styles.subtitle}>
              Join churches who easily manage their events with the #1 AI-powered church calendar tool.
            </p>
            <a href={process.env.NEXT_PUBLIC_AUTH_URL} className={styles.googleButton}>
              <FaGoogle /> {hasExistingTokens ? 'Sign in with Google' : 'Sign up with Google Calendar'}
            </a>
          </div>
        </div>

        <section className={styles.features}>
          <div className={styles.feature}>
            <Calendar className="w-12 h-12 text-blue-600 mb-4" />
            <h3>Smart Scheduling</h3>
            <p>Effortlessly manage your church events with our intuitive calendar interface.</p>
          </div>
          <div className={styles.feature}>
            <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
            <h3>AI Assistant</h3>
            <p>Get intelligent suggestions and reminders for upcoming events and activities.</p>
          </div>
          <div className={styles.feature}>
            <Clock className="w-12 h-12 text-blue-600 mb-4" />
            <h3>Time-Saving</h3>
            <p>Automate repetitive tasks and focus on what matters most to your congregation.</p>
          </div>
        </section>

        <section className={styles.pricing}>
          <h2>Simple, Transparent Pricing</h2>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingHeader}>
                <h3>Starter</h3>
                <div className={styles.price}>Free<span>/month</span></div>
              </div>
              <ul>
                <li>Basic calendar management</li>
                <li>Google Calendar integration</li>
                <li>Up to 50 events/month</li>
              </ul>
              <a href={process.env.NEXT_PUBLIC_AUTH_URL} className={styles.button}>Get Started</a>
            </div>
            <div className={`${styles.pricingCard} ${styles.featured}`}>
              <div className={styles.badge}>Popular</div>
              <div className={styles.pricingHeader}>
                <h3>Pro</h3>
                <div className={styles.price}>$19<span>/month</span></div>
              </div>
              <ul>
                <li>Everything in Starter</li>
                <li>AI-powered scheduling</li>
                <li>Unlimited events</li>
                <li>Priority support</li>
              </ul>
              <a href={process.env.NEXT_PUBLIC_AUTH_URL} className={`${styles.button} ${styles.featured}`}>Get Started</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
