import { GoogleCalendarClient, GoogleCalendarEvent } from './google-calendar';

interface AssistantResponse {
  message: string;
  calendarUpdated: boolean;
  operationResult: any;
}

interface EventDetails {
  summary: string;
  dateTime: {
    start: Date;
    end: Date;
  };
  description?: string;
}

export class CommandProcessor {
  constructor(private calendarClient: GoogleCalendarClient, private calendarId: string) {}

  async processResponse(message: string): Promise<AssistantResponse> {
    console.log('Processing command:', message);
    
    // Check for delete patterns
    const deletePatterns = ['delete', 'remove', 'cancel', 'clear'];
    const isDeleteCommand = deletePatterns.some(pattern => 
      message.toLowerCase().includes(pattern)
    );

    if (isDeleteCommand) {
      console.log('Detected delete command');
      return this.handleDeleteCommand(message);
    }

    // Check for create patterns
    const createPatterns = ['add', 'create', 'schedule', 'set up'];
    const isCreateCommand = createPatterns.some(pattern => 
      message.toLowerCase().includes(pattern)
    );

    if (isCreateCommand) {
      console.log('Detected create command');
      return this.handleCreateCommand(message);
    }

    return {
      message: "Command not recognized",
      calendarUpdated: false,
      operationResult: null
    };
  }

  private async handleDeleteCommand(message: string): Promise<AssistantResponse> {
    try {
      console.log('Processing delete command:', message);
      
      // Extract date from message
      const date = this.extractDate(message);
      if (!date) {
        return {
          message: "I'm not sure which date you want me to clear. Could you please specify if you mean today, tomorrow, or a specific date?",
          calendarUpdated: false,
          operationResult: null
        };
      }

      // Set up time range for the entire day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Finding events to delete between:', {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString()
      });

      // First get all events for the day
      const events = await this.calendarClient.getEvents(
        this.calendarId,
        startOfDay,
        endOfDay
      );

      // Delete each event individually
      const deletedEvents = [];
      for (const event of events) {
        if (event.id) {
          try {
            await this.calendarClient.deleteEvent(this.calendarId, event.id);
            deletedEvents.push({
              id: event.id,
              summary: event.summary
            });
          } catch (deleteError) {
            console.error(`Failed to delete event ${event.id}:`, deleteError);
          }
        }
      }

      // Create a conversational response based on the deleted events
      let response = '';
      if (deletedEvents.length === 0) {
        response = "I didn't find any events to remove for that day. Is there anything else you'd like me to help you with?";
      } else {
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const summaries = deletedEvents.map(event => event.summary).filter(Boolean);
        
        if (summaries.length > 0) {
          if (summaries.length === 1) {
            response = `I've removed "${summaries[0]}" from your calendar for ${dateStr}. What else can I help you with?`;
          } else {
            const lastSummary = summaries.pop();
            response = `I've removed ${summaries.join(', ')} and ${lastSummary} from your calendar for ${dateStr}. Is there anything else you need?`;
          }
        } else {
          response = `I've cleared all events from your calendar for ${dateStr}. What else would you like me to do?`;
        }
      }

      return {
        message: response,
        calendarUpdated: true,
        operationResult: {
          type: 'delete',
          success: true,
          deletedEvents
        }
      };
    } catch (error) {
      console.error('Error in handleDeleteCommand:', error);
      return {
        message: "I ran into an issue while trying to remove the events. Could you try again? If the problem persists, there might be a connection issue.",
        calendarUpdated: false,
        operationResult: {
          type: 'delete',
          success: false,
          error: error.message
        }
      };
    }
  }

  private async handleCreateCommand(message: string): Promise<AssistantResponse> {
    try {
      console.log('Processing create command:', message);
      
      // Extract event details from message
      const eventDetails = this.extractEventDetails(message);
      if (!eventDetails) {
        return {
          message: "I couldn't quite understand the event details. Could you please include both a title and time? For example, 'Create team meeting at 2pm' or 'Add lunch tomorrow at 12:30pm'.",
          calendarUpdated: false,
          operationResult: null
        };
      }

      console.log('Extracted event details:', eventDetails);

      // Create the event object
      const event: GoogleCalendarEvent = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.dateTime.start.toISOString(),
          timeZone: 'America/Chicago'
        },
        end: {
          dateTime: eventDetails.dateTime.end.toISOString(),
          timeZone: 'America/Chicago'
        }
      };

      console.log('Creating event:', event);

      // Create the event
      const result = await this.calendarClient.createEvent(this.calendarId, event);

      const dateStr = eventDetails.dateTime.start.toLocaleString('en-US', { 
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      });

      return {
        message: `I've added "${eventDetails.summary}" to your calendar for ${dateStr}. Would you like me to add any other events?`,
        calendarUpdated: true,
        operationResult: {
          type: 'create',
          success: true,
          event: result
        }
      };
    } catch (error) {
      console.error('Error in handleCreateCommand:', error);
      return {
        message: "I wasn't able to add that event to your calendar. Could you try again? If the problem continues, there might be a connection issue.",
        calendarUpdated: false,
        operationResult: {
          type: 'create',
          success: false,
          error: error.message
        }
      };
    }
  }

  private extractEventDetails(message: string): EventDetails | null {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Extract title
      let summary = '';
      const titlePatterns = [
        /(?:add|create|schedule)\s+(?:an?\s+)?(?:event\s+)?(?:called\s+|titled\s+|named\s+)?["']([^"']+)["']/i,
        /(?:add|create|schedule)\s+(?:an?\s+)?(.+?)(?:\s+(?:at|on|for|tomorrow|today|next|this))/i,
        /(?:add|create|schedule)\s+(?:an?\s+)?(.+)/i
      ];

      for (const pattern of titlePatterns) {
        const match = message.match(pattern);
        if (match) {
          summary = match[1].trim();
          break;
        }
      }

      if (!summary) {
        console.log('Could not extract event title');
        return null;
      }

      // Extract time
      const timePattern = /(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
      const timeMatch = lowerMessage.match(timePattern);
      
      const today = new Date();
      let eventDate = new Date(today);

      // Handle date specifications
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      // Handle "this [day]" pattern first
      const thisDayMatch = lowerMessage.match(new RegExp(`this\\s+(${days.join('|')})`, 'i'));
      if (thisDayMatch) {
        const targetDay = days.indexOf(thisDayMatch[1].toLowerCase());
        const currentDay = today.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        eventDate.setDate(today.getDate() + daysToAdd);
      }
      // Handle just the day name (assumes this week)
      else {
        const dayMatch = lowerMessage.match(new RegExp(`(?:on\\s+)?(${days.join('|')})`, 'i'));
        if (dayMatch) {
          const targetDay = days.indexOf(dayMatch[1].toLowerCase());
          const currentDay = today.getDay();
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) {
            daysToAdd += 7;
          }
          eventDate.setDate(today.getDate() + daysToAdd);
        }
        // Handle tomorrow
        else if (lowerMessage.includes('tomorrow')) {
          eventDate.setDate(eventDate.getDate() + 1);
        }
        // Handle specific date patterns (e.g., "21st", "January 21", etc.)
        else {
          const datePattern = /(\d+)(?:st|nd|rd|th)/;
          const dateMatch = lowerMessage.match(datePattern);
          if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            eventDate.setDate(day);
          }
        }
      }

      // Set the time
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const isPM = timeMatch[3]?.toLowerCase() === 'pm' || 
                    (!timeMatch[3] && hours < 8); // Assume PM for times before 8 without AM/PM

        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default to 9 AM if no time specified
        eventDate.setHours(9, 0, 0, 0);
      }

      // Set end time to 1 hour after start time
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + 1);

      console.log('Extracted date/time:', {
        summary,
        start: eventDate.toLocaleString(),
        end: endDate.toLocaleString()
      });

      return {
        summary,
        dateTime: {
          start: eventDate,
          end: endDate
        }
      };
    } catch (error) {
      console.error('Error extracting event details:', error);
      return null;
    }
  }

  private extractDate(message: string): Date | null {
    const today = new Date();
    const lowerMessage = message.toLowerCase();

    // Extract specific date patterns (e.g., "21st", "January 21", etc.)
    const datePattern = /(\d+)(st|nd|rd|th)/;
    const match = lowerMessage.match(datePattern);
    if (match) {
      const day = parseInt(match[1]);
      const result = new Date(today);
      result.setDate(day);
      return result;
    }

    // Handle relative dates
    if (lowerMessage.includes('today')) {
      return today;
    }
    
    if (lowerMessage.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    }

    // Handle day names
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (lowerMessage.includes(days[i])) {
        const targetDate = new Date(today);
        const currentDay = today.getDay();
        const targetDay = i;
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        targetDate.setDate(today.getDate() + daysToAdd);
        return targetDate;
      }
    }

    return null;
  }
} 