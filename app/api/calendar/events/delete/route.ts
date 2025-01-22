import { NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/app/utils/google-calendar';

export async function POST(request: Request) {
  try {
    const { eventId, accessToken, refreshToken, calendarId } = await request.json();
    
    if (!eventId || !accessToken || !refreshToken || !calendarId) {
      return NextResponse.json({ 
        error: 'Event ID, access token, refresh token, and calendar ID are required' 
      }, { status: 400 });
    }

    const calendarService = new GoogleCalendarClient(accessToken, refreshToken);
    await calendarService.deleteEvent(calendarId, eventId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event', details: error.message },
      { status: 500 }
    );
  }
} 