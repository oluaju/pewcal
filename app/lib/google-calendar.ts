import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface CalendarEventParams {
  title: string
  startTime: string
  endTime: string
  description?: string
  recurrence?: string[]
}

export class GoogleCalendar {
  private calendar
  
  constructor(accessToken: string, refreshToken: string) {
    const auth = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
    })
    
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
    
    this.calendar = google.calendar({ version: 'v3', auth })
  }
  
  async createEvent(calendarId: string, params: CalendarEventParams) {
    try {
      console.log('Creating event:', { calendarId, params })
      
      const result = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          summary: params.title,
          description: params.description,
          start: {
            dateTime: params.startTime,
            timeZone: 'America/Chicago'
          },
          end: {
            dateTime: params.endTime,
            timeZone: 'America/Chicago'
          },
          recurrence: params.recurrence
        }
      })
      
      console.log('Event created:', result.data)
      return result.data
    } catch (error) {
      console.error('Failed to create event:', error)
      throw new Error(`Failed to create event: ${error.message}`)
    }
  }
  
  async deleteEvent(calendarId: string, eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      })
      return true
    } catch (error) {
      console.error('Failed to delete event:', error)
      throw new Error(`Failed to delete event: ${error.message}`)
    }
  }
  
  async queryEvents(calendarId: string, params: {
    startTime?: string
    endTime?: string
    query?: string
  }) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: params.startTime || new Date().toISOString(),
        timeMax: params.endTime,
        q: params.query,
        singleEvents: true,
        orderBy: 'startTime'
      })
      
      return response.data.items || []
    } catch (error) {
      console.error('Failed to query events:', error)
      throw new Error(`Failed to query events: ${error.message}`)
    }
  }
} 