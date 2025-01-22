import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase credentials');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;
    const accessToken = cookieStore.get('access_token')?.value;

    if (!userId || !accessToken) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Get user profile and calendar
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, name, picture')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { authenticated: false, error: 'Profile not found' },
        { status: 401 }
      );
    }

    // Get user's calendar
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .select('id, google_calendar_id, name')
      .eq('owner_id', userId)
      .maybeSingle();

    if (calendarError) {
      console.error('Error fetching calendar:', calendarError);
      return NextResponse.json(
        { error: 'Failed to fetch calendar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: profile,
      calendar: calendar
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 