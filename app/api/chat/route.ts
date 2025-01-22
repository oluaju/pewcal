import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GoogleCalendar } from '@/app/lib/google-calendar'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    console.log('Received message:', message)

    // Get calendar ID from cookie
    const cookieStore = cookies()
    const encodedCalendarId = cookieStore.get('google_calendar_id')?.value
    const accessToken = cookieStore.get('access_token')?.value
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!encodedCalendarId) {
      return NextResponse.json({
        message: "Please select a calendar first.",
        error: "No calendar selected",
        status: 400
      })
    }

    if (!accessToken || !refreshToken) {
      return NextResponse.json({
        message: "Please sign in to continue.",
        error: "Authentication required",
        needsAuth: true,
        authUrl: '/api/auth/login'
      }, { status: 401 })
    }

    const calendarId = decodeURIComponent(encodedCalendarId)
    console.log('Using calendar:', calendarId)

    // Create calendar client
    const calendar = new GoogleCalendar(accessToken, refreshToken)

    // Parse the message - looking for "add" or "create" commands
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      // Extract title - everything between the command and "at" or "tomorrow"
      const titleMatch = message.match(/(?:add|create)\s+(.+?)(?:\s+(?:at|tomorrow|today|next|this))/i)
      const title = titleMatch ? titleMatch[1].trim() : ''

      // Get the date
      const today = new Date()
      let eventDate = new Date(today)
      
      if (lowerMessage.includes('tomorrow')) {
        eventDate.setDate(eventDate.getDate() + 1)
      }

      // Get the time
      const timeMatch = lowerMessage.match(/(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
        const isPM = timeMatch[3]?.toLowerCase() === 'pm' || (!timeMatch[3] && hours < 8)
        
        if (isPM && hours < 12) hours += 12
        if (!isPM && hours === 12) hours = 0
        
        eventDate.setHours(hours, minutes, 0, 0)
      } else {
        eventDate.setHours(9, 0, 0, 0) // Default to 9 AM
      }

      // Set end time to 1 hour later
      const endDate = new Date(eventDate)
      endDate.setHours(endDate.getHours() + 1)

      console.log('Creating event:', {
        title,
        start: eventDate.toISOString(),
        end: endDate.toISOString()
      })

      // Create the event
      const event = await calendar.createEvent(calendarId, {
        title,
        startTime: eventDate.toISOString(),
        endTime: endDate.toISOString()
      })

      return NextResponse.json({
        message: `Created event "${title}" for ${eventDate.toLocaleString()}`,
        success: true,
        calendarUpdated: true,
        result: event
      })
    }

    return NextResponse.json({
      message: "I can help you create calendar events. Try saying 'add [event] at [time]' or 'create [event] tomorrow at [time]'",
      success: false
    })

  } catch (error) {
    console.error('Error in chat endpoint:', error)
    return NextResponse.json({
      message: "Something went wrong. Please try again.",
      error: error.message
    }, { status: 500 })
  }
} 