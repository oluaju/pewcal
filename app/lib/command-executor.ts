import { CalendarCommand } from './calendar-commands'
import { GoogleCalendar } from './google-calendar'
import { cookies } from 'next/headers'

export async function executeCommand(command: CalendarCommand, calendarId: string) {
  console.log('DEBUG - Execute Step 1: Starting command execution:', { type: command.type, calendarId, params: command.params });
  
  const cookieStore = cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const refreshToken = cookieStore.get('refresh_token')?.value

  console.log('DEBUG - Execute Step 2: Auth tokens:', { 
    hasAccessToken: !!accessToken, 
    hasRefreshToken: !!refreshToken 
  });

  if (!accessToken || !refreshToken) {
    console.error('DEBUG - Execute Error: Missing auth tokens');
    throw new Error('Authentication required')
  }

  const calendar = new GoogleCalendar(accessToken, refreshToken)
  console.log('DEBUG - Execute Step 3: Calendar client initialized');
  
  try {
    switch (command.type) {
      case 'CREATE':
        if (!command.params.title || !command.params.startTime || !command.params.endTime) {
          console.error('DEBUG - Execute Error: Missing required params:', command.params);
          throw new Error('Missing required parameters for event creation')
        }
        
        console.log('DEBUG - Execute Step 4: Creating event:', {
          calendarId,
          title: command.params.title,
          start: command.params.startTime,
          end: command.params.endTime
        });
        
        const createdEvent = await calendar.createEvent(calendarId, {
          title: command.params.title,
          startTime: command.params.startTime,
          endTime: command.params.endTime,
          description: command.params.description,
          recurrence: command.params.recurrence
        })
        
        console.log('DEBUG - Execute Step 5: Event created:', createdEvent);
        return createdEvent;
      
      case 'DELETE':
        if (!command.params.startTime || !command.params.endTime) {
          console.error('Missing date range:', command.params);
          throw new Error('Missing date range for event deletion')
        }
        
        console.log('Querying events for deletion:', {
          calendarId,
          start: command.params.startTime,
          end: command.params.endTime,
          query: command.params.title
        });
        
        const events = await calendar.queryEvents(calendarId, {
          startTime: command.params.startTime,
          endTime: command.params.endTime,
          query: command.params.title
        })
        
        console.log('Found events to delete:', events.length);
        
        const results = await Promise.all(
          events.map(event => calendar.deleteEvent(calendarId, event.id))
        )
        
        const successCount = results.filter(Boolean).length;
        console.log('Deletion results:', { total: events.length, deleted: successCount });
        
        return {
          deletedCount: successCount,
          totalEvents: events.length
        }
      
      case 'QUERY':
        if (!command.params.startTime || !command.params.endTime) {
          console.error('Missing date range:', command.params);
          throw new Error('Missing date range for event query')
        }
        
        console.log('Querying events:', {
          calendarId,
          start: command.params.startTime,
          end: command.params.endTime,
          query: command.params.title
        });
        
        const queryResults = await calendar.queryEvents(calendarId, {
          startTime: command.params.startTime,
          endTime: command.params.endTime,
          query: command.params.title
        })
        
        console.log('Query results:', { count: queryResults.length });
        return queryResults
      
      default:
        console.error('DEBUG - Execute Error: Unknown command type:', command.type);
        throw new Error(`Unknown command type: ${command.type}`)
    }
  } catch (error) {
    console.error('DEBUG - Execute Error: Command execution failed:', error)
    throw error
  }
} 