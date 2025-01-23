import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ensure we have required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required Google OAuth credentials');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase credentials');
}

if (!process.env.GOOGLE_REDIRECT_URI || !process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('Missing required URIs');
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    console.log('Callback received:', {
      url: url.toString(),
      params: Object.fromEntries(url.searchParams)
    });

    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${error}`);
    }

    if (!code) {
      console.error('No code received in callback');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=no_code`);
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    oauth2Client.setCredentials(tokens);

    // Store tokens securely in cookies
    const cookieStore = cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days for access token
    };

    // Store expiry date for token refresh
    if (tokens.expiry_date) {
      cookieStore.set('token_expiry', tokens.expiry_date.toString(), cookieOptions);
    }

    // Set access token with longer expiry
    cookieStore.set('access_token', tokens.access_token!, cookieOptions);

    if (tokens.refresh_token) {
      const refreshTokenOptions = {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 // 30 days for refresh token
      };
      cookieStore.set('refresh_token', tokens.refresh_token, refreshTokenOptions);
    }

    // Get user info
    console.log('Fetching user info...');
    const oauth2 = google.oauth2('v2');
    const { data: userInfo } = await oauth2.userinfo.get({ auth: oauth2Client });
    console.log('User info received:', {
      hasEmail: !!userInfo.email,
      hasName: !!userInfo.name
    });

    if (!userInfo.email) {
      console.error('No email received from Google');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=no_email`);
    }

    // Create or update user profile with session info
    console.log('Updating user profile...');
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Try to fetch the existing profile instead
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select()
        .eq('email', userInfo.email)
        .single();

      if (fetchError) {
        console.error('Error fetching existing profile:', fetchError);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=profile_error`);
      }

      profile = existingProfile;
    }

    if (!profile) {
      console.error('No profile found or created');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=profile_error`);
    }

    // Store user ID in cookie with longer expiry
    cookieStore.set('user_id', profile.id, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 // 30 days for user ID
    });

    // Check for existing calendar
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .select('id, google_calendar_id')
      .eq('owner_id', profile.id)
      .maybeSingle();

    if (!calendar) {
      console.log('No calendar found, redirecting to setup');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/calendar/setup`);
    }

    if (calendarError) {
      console.error('Error fetching calendar:', calendarError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=calendar_error`);
    }

    // Store calendar IDs in cookies with longer expiry
    cookieStore.set('calendar_id', calendar.id, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    cookieStore.set('google_calendar_id', calendar.google_calendar_id, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    console.log('Redirecting to calendar:', calendar.id);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/calendar/${calendar.id}`);

  } catch (error) {
    console.error('Error in callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=callback_error`);
  }
} 