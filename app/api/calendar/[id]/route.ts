import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/app/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching calendar details for ID:', params.id);
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      console.log('No userId found in cookies');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // First check if calendar exists
    const { data: calendar, error: calendarError } = await supabase
      .from('calendars')
      .select(`
        *,
        owner:user_profiles!owner_id(
          email,
          name
        ),
        calendar_shares(
          user_id,
          role
        )
      `)
      .eq('id', params.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid PGRST116 error

    if (calendarError) {
      console.error('Error fetching calendar:', calendarError);
      return NextResponse.json(
        { error: 'Failed to fetch calendar' },
        { status: 500 }
      );
    }

    if (!calendar) {
      console.log('Calendar not found');
      return NextResponse.json(
        { error: 'Calendar not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this calendar
    const isOwner = calendar.owner_id === userId;
    const isShared = calendar.calendar_shares.some(
      (share: any) => share.user_id === userId
    );

    if (!isOwner && !isShared) {
      console.log('Access denied for user:', userId);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.log('Successfully fetched calendar');
    return NextResponse.json(calendar);
  } catch (error) {
    console.error('Error in calendar details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar details' },
      { status: 500 }
    );
  }
} 