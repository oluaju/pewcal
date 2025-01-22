import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { calendarId } = await request.json();
    
    if (!calendarId) {
      return NextResponse.json(
        { error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    // Create the response with the redirect
    const response = NextResponse.json({ success: true });

    // Set the cookie with proper attributes
    // Note: Calendar IDs from Google are already URL-safe, but we'll encode to be safe
    const encodedCalendarId = encodeURIComponent(calendarId);
    response.cookies.set('google_calendar_id', encodedCalendarId, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('Setting calendar ID cookie:', {
      original: calendarId,
      encoded: encodedCalendarId
    });

    return response;
  } catch (error) {
    console.error('Error selecting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to select calendar' },
      { status: 500 }
    );
  }
} 