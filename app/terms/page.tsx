"use client";

import Link from 'next/link';
import styles from '../page.module.css';

export default function TermsOfService() {
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
          <h1>Terms of Service</h1>
          
          <div className="space-y-6 text-left max-w-4xl mx-auto">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using PewPal ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
              <p className="mb-4">
                PewPal is a calendar management application that integrates with Google Calendar. The Service allows users to:
              </p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>View and manage calendar events</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Create and modify calendar entries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Integrate with Google Calendar</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Use natural language processing for event management</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
              <p className="mb-4">To use PewPal, you must:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Have a valid Google account</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Provide accurate and complete information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Maintain the security of your account</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Accept responsibility for all activities under your account</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. User Responsibilities</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-none space-y-2 mb-4" style={{ listStyleType: 'none' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Use the Service for any illegal purpose</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Attempt to gain unauthorized access to the Service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Interfere with or disrupt the Service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Share your account credentials with others</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Use the Service in a way that could damage or impair it</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by PewPal and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p className="mb-4">
                PewPal shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us at:
                <br />
                Email: terms@pewpal.com
              </p>
            </section>

            <section>
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