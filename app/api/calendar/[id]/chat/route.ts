import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleCalendarClient } from '@/app/utils/google-calendar';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json();
    console.log('DEBUG - Step 1: Received message:', message);

    // Get auth tokens and calendar ID
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const googleCalendarId = cookieStore.get('google_calendar_id')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({
        message: "Please sign in to continue.",
        error: "Authentication required",
        needsAuth: true,
        authUrl: '/api/auth/login'
      }, { status: 401 });
    }

    if (!googleCalendarId) {
      return NextResponse.json({
        message: "Please select a calendar first.",
        error: "No calendar selected",
        calendarUpdated: false
      }, { status: 400 });
    }

    console.log('DEBUG - Step 2: Using calendar:', googleCalendarId);

    // Initialize calendar client
    const calendar = new GoogleCalendarClient(accessToken, refreshToken);
    console.log('DEBUG - Step 3: Calendar client initialized');

    const lowerMessage = message.toLowerCase();
    const decodedCalendarId = decodeURIComponent(googleCalendarId);

    // Handle delete command
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      // First get events for today to find matches
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('DEBUG - Step 4: Searching for events to delete');
      const events = await calendar.getEvents(decodedCalendarId, today, tomorrow);

      // Extract the event title from the message
      const titleMatch = message.match(/(?:delete|remove)\s+(.+?)(?:\s+(?:at|from|today|tomorrow|$))/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      if (!title) {
        return NextResponse.json({
          message: "I couldn't understand which event to delete. Please try 'delete [event name]'",
          calendarUpdated: false
        });
      }

      console.log('DEBUG - Step 5: Looking for events matching:', title);
      const matchingEvents = events.filter(event => 
        event.summary?.toLowerCase().includes(title.toLowerCase())
      );

      if (matchingEvents.length === 0) {
        return NextResponse.json({
          message: `I couldn't find any events matching "${title}"`,
          calendarUpdated: false
        });
      }

      // Delete all matching events
      console.log('DEBUG - Step 6: Deleting events:', matchingEvents);
      for (const event of matchingEvents) {
        if (event.id) {
          await calendar.deleteEvent(decodedCalendarId, event.id);
        }
      }

      return NextResponse.json({
        message: `Deleted ${matchingEvents.length} event(s) matching "${title}"`,
        calendarUpdated: true
      });
    }

    // Handle create/add command
    if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      // Extract title - everything between the command and "at" or "tomorrow"
      const titleMatch = message.match(/(?:add|create)\s+(.+?)(?:\s+(?:at|tomorrow|today|next|this))/i);
      const title = titleMatch ? titleMatch[1].trim() : '';

      if (!title) {
        console.log('DEBUG - Step 4: Could not extract title');
        return NextResponse.json({
          message: "I couldn't understand the event title. Please try again with a format like 'add meeting at 2pm' or 'create lunch tomorrow at noon'.",
          calendarUpdated: false
        });
      }

      console.log('DEBUG - Step 4: Extracted title:', title);

      // Get the date
      const today = new Date();
      let eventDate = new Date(today);
      
      if (lowerMessage.includes('tomorrow')) {
        eventDate.setDate(eventDate.getDate() + 1);
      }

      // Get the time
      const timeMatch = lowerMessage.match(/(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const isPM = timeMatch[3]?.toLowerCase() === 'pm' || (!timeMatch[3] && hours < 8);
        
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        eventDate.setHours(9, 0, 0, 0); // Default to 9 AM
      }

      // Set end time to 1 hour later
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + 1);

      console.log('DEBUG - Step 5: Creating event:', {
        title,
        start: eventDate.toISOString(),
        end: endDate.toISOString(),
        calendarId: decodedCalendarId
      });

      // Create the event
      const event = await calendar.createEvent({
        summary: title,
        start: {
          dateTime: eventDate.toISOString(),
          timeZone: 'America/Chicago'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Chicago'
        }
      }, decodedCalendarId);

      console.log('DEBUG - Step 6: Created event:', event);

      return NextResponse.json({
        message: `Created event "${title}" for ${eventDate.toLocaleString()}`,
        calendarUpdated: true,
        result: event
      });
    }

    // Handle update command (coming soon)
    if (lowerMessage.includes('update') || lowerMessage.includes('change')) {
      return NextResponse.json({
        message: "Update functionality coming soon. For now, you can delete the event and create a new one.",
        calendarUpdated: false
      });
    }

    return NextResponse.json({
      message: "I can help you manage calendar events. Try:\n- 'add [event] at [time]'\n- 'delete [event]'\n- 'create [event] tomorrow at [time]'",
      calendarUpdated: false
    });

  } catch (error) {
    console.error('DEBUG - Error in chat endpoint:', error);
    return NextResponse.json({
      message: "Something went wrong. Please try again.",
      error: error.message,
      calendarUpdated: false
    }, { status: 500 });
  }
} 