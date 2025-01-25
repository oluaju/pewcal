"use client";

import Link from 'next/link';
import styles from '../page.module.css';

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            PewPal
          </Link>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.loginButton}>
              Back to Home
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h1>Privacy Policy</h1>
          
          <div className="space-y-6 text-left max-w-4xl mx-auto">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">When you use PewPal, we collect the following types of information:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Your Google account information (name, email, profile picture)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Calendar data (events, schedules, and related information)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Usage data (how you interact with our application)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Device information (browser type, operating system)</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Provide and maintain our calendar service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Manage your account and preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Improve our application and user experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Communicate with you about service updates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Ensure security and prevent fraud</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Data Storage and Security</h2>
              <p className="mb-4">We take data security seriously and implement appropriate measures to protect your information:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Secure data encryption in transit and at rest</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Regular security audits and updates</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Limited access to personal data by authorized personnel</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Compliance with data protection regulations</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Third-Party Services</h2>
              <p className="mb-4">We use the following third-party services:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Google Calendar API for calendar management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Google OAuth for authentication</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Supabase for data storage</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Access your personal data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Correct inaccurate data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Request deletion of your data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Export your data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Withdraw consent at any time</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                Email: privacy@pewpal.com
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
              </p>
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </section>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Link href="/privacy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.footerLink}>
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
} 