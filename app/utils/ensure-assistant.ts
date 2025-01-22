import { openai, MODEL } from '../assistant-config';

export async function ensureAssistant() {
  try {
    // Delete existing assistant if it exists
    if (process.env.OPENAI_ASSISTANT_ID) {
      try {
        await openai.beta.assistants.del(process.env.OPENAI_ASSISTANT_ID);
        console.log('Deleted existing assistant');
      } catch (error) {
        console.log('No existing assistant to delete');
      }
    }

    // Create new assistant with enhanced configuration
    const assistant = await openai.beta.assistants.create({
      name: "Calendar Assistant",
      instructions: `You are a calendar assistant that helps manage events through natural language commands.

CORE RULES:
1. ALWAYS respond with function calls, never with text
2. Extract date, time, and event details from natural language
3. Use appropriate functions based on command type
4. Handle relative dates (today, tomorrow, next week) and times (morning, afternoon, evening)
5. Default to reasonable times when not specified

For "add" or "create" commands:
- Use create_event function
- Extract event name, date, time, and duration
- Default time to 9 AM if not specified
- Set duration to 1 hour unless specified
Example: "add bible study tomorrow at 7pm"
→ create_event with:
{
  "summary": "Bible Study",
  "date": "tomorrow",
  "time": "7pm",
  "duration": 1
}

For "delete" or "remove" commands:
- Use delete_events function
- Extract event name and date range
- Use full day range when time not specified
Example: "delete bible study tomorrow"
→ delete_events with:
{
  "query": "bible study",
  "date": "tomorrow"
}

TIME PARSING:
- Specific times: "3pm", "15:00", "3:30pm"
- Keywords: "morning" (9 AM), "afternoon" (2 PM), "evening" (7 PM), "night" (8 PM)
- Default to 9 AM if not specified

DATE PARSING:
- "today" → current date
- "tomorrow" → next day
- "next week" → 7 days from now
- Day names (e.g., "Monday") → next occurrence
- Dates (e.g., "January 21") → specified date

IMPORTANT: Always extract and pass the raw date/time strings to let the backend handle the actual date calculations.`,
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
                date: {
                  type: "string",
                  description: "The date for the event (e.g., 'today', 'tomorrow', 'next week')"
                },
                time: {
                  type: "string",
                  description: "The time for the event (e.g., '3pm', 'morning', '15:00')"
                },
                duration: {
                  type: "number",
                  description: "Duration in hours"
                },
                description: {
                  type: "string",
                  description: "Optional description of the event"
                },
                recurrence: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional recurrence rules"
                }
              },
              required: ["summary", "date"]
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
                date: {
                  type: "string",
                  description: "The date to delete events from (e.g., 'today', 'tomorrow')"
                }
              },
              required: ["date"]
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