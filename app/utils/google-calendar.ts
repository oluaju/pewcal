import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
}

export class GoogleCalendarClient {
  private calendar;

  constructor(accessToken: string, refreshToken: string) {
    console.log('Initializing GoogleCalendarClient');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('GoogleCalendarClient initialized');
  }

  async createEvent(event: GoogleCalendarEvent, calendarId: string) {
    try {
      console.log('Creating event in calendar:', calendarId);
      console.log('Event details:', JSON.stringify(event, null, 2));
      
      const result = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          ...event,
          start: {
            dateTime: event.start.dateTime,
            timeZone: event.start.timeZone || 'America/Chicago'
          },
          end: {
            dateTime: event.end.dateTime,
            timeZone: event.end.timeZone || 'America/Chicago'
          }
        }
      });
      
      console.log('Event created successfully:', JSON.stringify(result.data, null, 2));
      return result.data;
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async deleteEvent(calendarId: string, eventId: string) {
    try {
      console.log('Deleting event:', { calendarId, eventId });
      await this.calendar.events.delete({
        calendarId,
        eventId
      });
      console.log('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async getEvents(calendarId: string, startDate?: Date, endDate?: Date) {
    try {
      console.log('Fetching events:', { calendarId, startDate, endDate });
      
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startDate ? startDate.toISOString() : new Date().toISOString(),
        timeMax: endDate ? endDate.toISOString() : undefined,
        singleEvents: true,
        orderBy: 'startTime'
      });

      console.log(`Found ${response.data.items?.length || 0} events`);
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }
} 