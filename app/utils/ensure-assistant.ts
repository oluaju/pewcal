import { openai, MODEL } from '../assistant-config';

export async function ensureAssistant() {
  try {
    // Try to retrieve existing assistant
    if (process.env.OPENAI_ASSISTANT_ID) {
      try {
        const existing = await openai.beta.assistants.retrieve(process.env.OPENAI_ASSISTANT_ID);
        console.log('Found existing assistant:', {
          id: existing.id,
          name: existing.name,
          model: existing.model,
          hasTools: existing.tools?.length > 0
        });
        return process.env.OPENAI_ASSISTANT_ID;
      } catch (error) {
        console.log('Assistant not found, creating new one...');
      }
    }

    // Create new assistant with enhanced configuration
    const assistant = await openai.beta.assistants.create({
      name: "Calendar Assistant",
      instructions: `You are a helpful calendar assistant that understands natural language requests for managing calendar events.

GENERAL GUIDELINES:
- Be flexible with language and understand various ways users might phrase requests
- Handle both specific and vague time references
- Always respond using the appropriate function call
- Default to user's local timezone
- For ambiguous times, use common sense (e.g. "dinner" = evening, "meeting" = business hours)

TIME HANDLING:
- Always use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) in responses
- Map natural times to specific hours:
  * "morning" → 9:00 AM
  * "afternoon" → 2:00 PM
  * "evening" → 7:00 PM
  * "night" → 8:00 PM
  * "dinner" → 6:30 PM
  * "lunch" → 12:00 PM

For recurring events:
- Use RRULE format for recurrence rules
- Example: FREQ=WEEKLY;BYDAY=WE for weekly on Wednesday

IMPORTANT: 
1. Always use function calls to respond. Never return raw text or JSON.
2. For event creation:
   - Use create_event function
   - Set summary to the event title
   - Set start and end times in ISO format
   - Add recurrence if specified
3. For event deletion:
   - Use delete_events function
   - Set date range and query
4. For calendar queries:
   - Use query_calendar function
   - Set type and date range

Example: "add bible study tomorrow at 6pm"
Should call create_event with:
{
  "summary": "Bible Study",
  "start": "2024-01-24T18:00:00.000Z",
  "end": "2024-01-24T19:00:00.000Z"
}`,
      model: MODEL,
      tools: [
        {
          type: "function",
          function: {
            name: "create_event",
            description: "Create a new calendar event",
            parameters: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "The title/summary of the event"
                },
                description: {
                  type: "string",
                  description: "Optional description of the event"
                },
                start: {
                  type: "string",
                  description: "Start time of the event in ISO format"
                },
                end: {
                  type: "string",
                  description: "End time of the event in ISO format"
                },
                recurrence: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description: "Optional recurrence rules for recurring events"
                }
              },
              required: ["summary", "start", "end"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "delete_events",
            description: "Delete calendar events matching the criteria",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search term to match event titles"
                },
                startDate: {
                  type: "string",
                  description: "Start of date range in ISO format"
                },
                endDate: {
                  type: "string",
                  description: "End of date range in ISO format"
                }
              },
              required: ["startDate", "endDate"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "query_calendar",
            description: "Query the calendar for events or check availability",
            parameters: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["availability", "schedule"],
                  description: "Type of query to perform"
                },
                startDate: {
                  type: "string",
                  description: "Start of date range in ISO format"
                },
                endDate: {
                  type: "string",
                  description: "End of date range in ISO format"
                }
              },
              required: ["type", "startDate", "endDate"]
            }
          }
        }
      ]
    });

    console.log('Created new assistant:', {
      id: assistant.id,
      name: assistant.name,
      model: assistant.model,
      hasTools: assistant.tools?.length > 0
    });
    return assistant.id;
  } catch (error) {
    console.error('Error ensuring assistant exists:', error);
    throw error;
  }
} 