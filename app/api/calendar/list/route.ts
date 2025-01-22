import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { oauth2Client } from '@/app/utils/google';

export async function GET() {
  try {
    console.log('=== Starting Calendar List Request ===');
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const tokenExpiry = cookieStore.get('token_expiry')?.value;
    const userId = cookieStore.get('user_id')?.value;

    console.log('Auth Check:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId,
      tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)) : null
    });

    if (!userId || !accessToken) {
      console.log('Missing auth info:', { 
        userId: !!userId,
        accessToken: !!accessToken
      });
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      );
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: tokenExpiry ? parseInt(tokenExpiry) : undefined
    });

    // Check if token needs refresh
    const now = Date.now();
    if (tokenExpiry && parseInt(tokenExpiry) < now) {
      console.log('Token expired, attempting refresh...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('Token refresh successful:', {
          hasNewAccessToken: !!credentials.access_token,
          hasNewExpiry: !!credentials.expiry_date
        });

        // Create response with updated cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        // Set new access token with 7 day expiry
        cookieStore.set('access_token', credentials.access_token!, {
          ...cookieOptions,
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        // Update expiry date
        if (credentials.expiry_date) {
          cookieStore.set('token_expiry', credentials.expiry_date.toString(), {
            ...cookieOptions,
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
        }

        // Update oauth client with new credentials
        oauth2Client.setCredentials(credentials);
      } catch (refreshError: any) {
        console.error('Token refresh failed:', {
          message: refreshError.message,
          details: refreshError.response?.data
        });
        return NextResponse.json(
          { error: 'Failed to refresh authentication. Please sign in again.' },
          { status: 401 }
        );
      }
    }

    // Get calendar list
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();

    // Log calendar list details
    console.log('Calendar list response:', {
      status: response.status,
      itemCount: response.data.items?.length || 0
    });

    if (!response.data.items || response.data.items.length === 0) {
      console.log('No calendars found');
      return NextResponse.json([]);
    }

    // Return only calendars where user has write access
    const writableCalendars = response.data.items.filter(cal => 
      cal.accessRole && ['owner', 'writer'].includes(cal.accessRole)
    );

    console.log('Writable calendars:', {
      total: response.data.items.length,
      writable: writableCalendars.length
    });

    return NextResponse.json(writableCalendars);

  } catch (error: any) {
    console.error('Error fetching calendars:', {
      message: error.message,
      details: error.response?.data
    });
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
} 