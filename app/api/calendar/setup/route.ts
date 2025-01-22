import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { googleCalendarId, name } = await request.json();

    if (!googleCalendarId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create calendar in database
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .insert([
        {
          google_calendar_id: googleCalendarId,
          name,
          owner_id: userId,
          is_primary: true // First calendar is primary
        }
      ])
      .select()
      .single();

    if (calendarError) {
      console.error('Error creating calendar:', calendarError);
      return NextResponse.json(
        { error: 'Failed to create calendar' },
        { status: 500 }
      );
    }

    // Create response with cookie
    const response = NextResponse.json(calendar);

    // Set the cookie with proper attributes
    response.cookies.set('google_calendar_id', googleCalendarId, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Error in calendar setup:', error);
    return NextResponse.json(
      { error: 'Failed to set up calendar', details: error.message },
      { status: 500 }
    );
  }
} 