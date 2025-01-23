import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { oauth2Client } from '@/app/utils/google';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const encodedCalendarId = cookieStore.get('google_calendar_id')?.value;

    console.log('Debug - Cookie values:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      encodedCalendarId,
      allCookies: cookieStore.getAll().map(c => c.name)
    });

    if (!accessToken) {
      console.log('Debug - No access token found');
      return NextResponse.json(
        { error: 'No access token available. Please authenticate first.' },
        { status: 401 }
      );
    }

    if (!encodedCalendarId) {
      console.log('Debug - No calendar ID found');
      return NextResponse.json(
        { error: 'No calendar ID found. Please set up your calendar first.' },
        { status: 400 }
      );
    }

    // Decode the calendar ID before using it
    const googleCalendarId = decodeURIComponent(encodedCalendarId);
    console.log('Debug - Using calendar ID:', {
      encoded: encodedCalendarId,
      decoded: googleCalendarId
    });

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    console.log('Debug - Creating calendar client');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get calendar colors
    const colorsResponse = await calendar.colors.get();
    const calendarColors = colorsResponse.data.calendar || {};
    
    // Get calendar details to get its color ID
    const calendarResponse = await calendar.calendarList.get({
      calendarId: googleCalendarId
    });
    
    const calendarColorId = calendarResponse.data.colorId;
    const calendarColor = calendarColorId ? calendarColors[calendarColorId]?.background : '#0A84FF';

    // Get events from 1 year ago to 1 year in the future
    const timeMin = new Date();
    timeMin.setFullYear(timeMin.getFullYear() - 1);
    const timeMax = new Date();
    timeMax.setFullYear(timeMax.getFullYear() + 1);

    console.log('Debug - Fetching events for calendar:', googleCalendarId);
    const response = await calendar.events.list({
      calendarId: googleCalendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 5000,
    });
    
    console.log('Debug - Successfully fetched events:', {
      count: response.data.items?.length || 0
    });

    // Add calendar color to each event if they don't have their own color
    const events = response.data.items?.map(event => ({
      ...event,
      calendarColor: event.colorId ? calendarColors[event.colorId]?.background : calendarColor
    })) || [];
    
    return NextResponse.json(events);
  } catch (error: any) {
    // Log the full error details
    console.error('Error fetching events:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      }
    });

    // Check for specific Google API errors
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. You may not have permission to view this calendar.' },
        { status: 403 }
      );
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Calendar not found. Please select a different calendar.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch events', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const googleCalendarId = cookieStore.get('google_calendar_id')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to handle callback', details: 'No access token available. Please authenticate first.' },
        { status: 401 }
      );
    }

    if (!googleCalendarId) {
      return NextResponse.json(
        { error: 'No calendar ID found. Please set up your calendar first.' },
        { status: 400 }
      );
    }

    // Set credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const body = await request.json();

    const event = await calendar.events.insert({
      calendarId: googleCalendarId,
      requestBody: {
        summary: body.summary,
        description: body.description,
        start: { dateTime: new Date(body.start).toISOString() },
        end: { dateTime: new Date(body.end).toISOString() },
        recurrence: body.recurrence,
      },
    });
    
    return NextResponse.json({ event: event.data });
  } catch (error: any) {
    console.error('Error creating event:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
} 