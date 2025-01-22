import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    const cookieStore = cookies();
    
    // Clear all calendar-related cookies
    const cookiesToClear = [
      'google_calendar_id',
      'access_token',
      'refresh_token',
      'token_expiry',
      'user_id'
    ];

    cookiesToClear.forEach(cookieName => {
      // Delete the cookie by setting it with an expired date and empty value
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        maxAge: 0,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      });
    });

    console.log('Cleared cookies:', cookiesToClear);
    return response;
  } catch (error) {
    console.error('Error cleaning up cookies:', error);
    return NextResponse.json(
      { error: 'Failed to clean up session' },
      { status: 500 }
    );
  }
} 