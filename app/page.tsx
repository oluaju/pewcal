"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { FaGoogle } from 'react-icons/fa';
import Link from 'next/link';
import { Calendar, MessageSquare, Clock, Menu, X } from 'lucide-react';

export default function Home() {
  const [hasExistingTokens, setHasExistingTokens] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user has existing tokens by looking for refresh_token cookie
    setHasExistingTokens(document.cookie.includes('refresh_token='));
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            PewCal
          </Link>
          <button className={styles.menuButton} onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={`${styles.navLinks} ${isMenuOpen ? styles.open : ''}`}>
            <Link href="#features" onClick={() => setIsMenuOpen(false)}>Features</Link>
            <Link href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <a href="/api/auth/login" className={styles.loginButton} onClick={() => setIsMenuOpen(false)}>
              {hasExistingTokens ? 'Sign in' : 'Get Started'}
            </a>
          </div>
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
            <a href="/api/auth/login" className={styles.googleButton}>
              <FaGoogle /> {hasExistingTokens ? 'Sign in with Google' : 'Sign up with Google Calendar'}
            </a>
          </div>
        </div>

        <section id="features" className={styles.features}>
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

        <section id="pricing" className={styles.pricing}>
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
              <a href="/api/auth/login" className={styles.googleButton}>Get Started</a>
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
              <a href="/api/auth/login" className={`${styles.googleButton}`}>Get Started</a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
