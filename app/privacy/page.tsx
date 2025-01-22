export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-4">When you use PewCal, we collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your Google account information (name, email, profile picture)</li>
            <li>Calendar data (events, schedules, and related information)</li>
            <li>Usage data (how you interact with our application)</li>
            <li>Device information (browser type, operating system)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain our calendar service</li>
            <li>Manage your account and preferences</li>
            <li>Improve our application and user experience</li>
            <li>Communicate with you about service updates</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Security</h2>
          <p className="mb-4">We take data security seriously and implement appropriate measures to protect your information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Secure data encryption in transit and at rest</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal data by authorized personnel</li>
            <li>Compliance with data protection regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
          <p className="mb-4">We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google Calendar API for calendar management</li>
            <li>Google OAuth for authentication</li>
            <li>Supabase for data storage</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            Email: privacy@pewcal.com
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
          </p>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  );
} 