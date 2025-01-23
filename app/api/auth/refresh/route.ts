import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
);

export async function POST() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }

    // Set the credentials and refresh the token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update cookies with new tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    };

    const response = NextResponse.json({ success: true });

    // Set new access token
    response.cookies.set('access_token', credentials.access_token!, cookieOptions);

    // Update expiry date
    if (credentials.expiry_date) {
      response.cookies.set('token_expiry', credentials.expiry_date.toString(), cookieOptions);
    }

    return response;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
} 