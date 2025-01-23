import { google } from 'googleapis';

const CALLBACK_URL = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  CALLBACK_URL
);

export function getGoogleOAuthURL(forceConsent = false): string {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing required Google OAuth configuration');
  }

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar',  // Full calendar access
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const options = {
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
  };

  // Only add prompt: 'consent' if we explicitly want to force consent
  if (forceConsent) {
    options['prompt'] = 'consent';
  }

  return oauth2Client.generateAuthUrl(options);
}

export { oauth2Client, CALLBACK_URL }; 