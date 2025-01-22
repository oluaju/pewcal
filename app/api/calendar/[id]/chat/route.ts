import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleCalendarClient } from '@/app/utils/google-calendar';
import { openai } from '@/app/assistant-config';
import { ensureAssistant } from '@/app/utils/ensure-assistant';
import { createTimeRange, getFullDayRange, formatForGoogle } from '@/app/utils/date-utils';

interface MessageContent {
  type: 'text' | 'function';
  text?: { value: string };
  function?: {
    name: string;
    arguments: string;
  };
}

interface AssistantMessage {
  role: 'assistant';
  content: MessageContent[];
}

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

    // Properly decode the calendar ID
    const decodedCalendarId = decodeURIComponent(decodeURIComponent(googleCalendarId));
    console.log('DEBUG - Step 2: Using calendar:', {
      encoded: googleCalendarId,
      decoded: decodedCalendarId
    });

    // Initialize calendar client
    const calendar = new GoogleCalendarClient(accessToken, refreshToken);
    console.log('DEBUG - Step 3: Calendar client initialized');

    // Get or create assistant
    const assistantId = await ensureAssistant();
    console.log('DEBUG - Step 4: Using assistant:', assistantId);

    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log('DEBUG - Step 5: Created thread:', thread.id);

    // Add the message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });
    console.log('DEBUG - Step 6: Added message to thread');

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      tools: [
        {
          type: "function",
          function: {
            name: "create_event",
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
    console.log('DEBUG - Step 7: Started assistant run:', run.id);

    // Wait for the run to complete or require action
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      console.log('DEBUG - Step 8: Run status:', runStatus.status);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Handle required actions (function calls)
    if (runStatus.status === 'requires_action') {
      console.log('DEBUG - Step 9: Run requires action:', JSON.stringify(runStatus.required_action, null, 2));
      
      const toolCalls = runStatus.required_action?.submit_tool_outputs?.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        throw new Error('No tool calls found in required action');
      }

      const toolCall = toolCalls[0]; // We only handle one function call at a time
      console.log('DEBUG - Step 10: Raw tool call:', JSON.stringify(toolCall, null, 2));

      // Access the function properties directly from the toolCall object
      const name = toolCall.function.name;
      const args = toolCall.function.arguments;
      console.log('DEBUG - Step 11: Function details:', { name, arguments: args });

      // Process the function call
      try {
        const parsedArgs = JSON.parse(args);
        console.log('DEBUG - Step 12: Parsed arguments:', parsedArgs);

        // Submit the tool outputs back to the assistant
        await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
          tool_outputs: [
            {
              tool_call_id: toolCall.id,
              output: JSON.stringify({ success: true })
            }
          ]
        });

        switch (name) {
          case 'delete_events': {
            const { query, date } = parsedArgs;
            const timeRange = getFullDayRange(date);

            const events = await calendar.getEvents(
              decodedCalendarId, 
              timeRange.start,
              timeRange.end
            );

            const matchingEvents = query ? 
              events.filter(event => {
                const eventSummary = event.summary?.toLowerCase() || '';
                const searchWords = query.toLowerCase().split(/\s+/);
                return searchWords.every(word => eventSummary.includes(word));
              }) : 
              events;

            if (matchingEvents.length === 0) {
              return NextResponse.json({
                message: query ? 
                  `I couldn't find any events matching "${query}"` :
                  "I couldn't find any events in that time period",
                calendarUpdated: false
              });
            }

            for (const event of matchingEvents) {
              if (event.id) {
                await calendar.deleteEvent(decodedCalendarId, event.id);
              }
            }

            return NextResponse.json({
              message: `Deleted ${matchingEvents.length} event(s)${query ? ` matching "${query}"` : ''}`,
              calendarUpdated: true
            });
          }

          case 'create_event': {
            const { summary, date, time, duration = 1, description, recurrence } = parsedArgs;
            const timeRange = createTimeRange(date, time, duration);

            const event = await calendar.createEvent({
              summary,
              description,
              start: {
                dateTime: formatForGoogle(timeRange.start),
                timeZone: 'America/Chicago'
              },
              end: {
                dateTime: formatForGoogle(timeRange.end),
                timeZone: 'America/Chicago'
              },
              recurrence
            }, decodedCalendarId);

            return NextResponse.json({
              message: `Created event "${summary}" from ${timeRange.start.toLocaleString()} to ${timeRange.end.toLocaleString()}`,
              calendarUpdated: true,
              result: event
            });
          }

          default:
            return NextResponse.json({
              message: "I don't know how to handle that type of request yet.",
              calendarUpdated: false
            });
        }
      } catch (error) {
        console.error('DEBUG - Error processing function call:', error);
        return NextResponse.json({
          message: "Something went wrong processing your request. Please try again.",
          error: error.message,
          calendarUpdated: false
        }, { status: 500 });
      }
    }

    if (runStatus.status !== 'completed') {
      console.error('DEBUG - Step 9: Assistant run failed:', runStatus);
      return NextResponse.json({
        message: "I had trouble processing your request. Please try again.",
        error: `Assistant run failed: ${runStatus.status}`
      }, { status: 500 });
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data[0] as AssistantMessage;
    console.log('DEBUG - Step 10: Full assistant response:', JSON.stringify(assistantMessage, null, 2));

    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      console.error('DEBUG - Step 11: No message content');
      return NextResponse.json({
        message: "I didn't get a response. Please try again.",
        error: "No response from assistant"
      }, { status: 500 });
    }

    // Log all content types received
    console.log('DEBUG - Step 12: Content types:', assistantMessage.content.map(c => c.type));
    
    // Handle the function call from the assistant
    const functionContent = assistantMessage.content.find(c => c.type === 'function');
    console.log('DEBUG - Step 13: Function content:', JSON.stringify(functionContent, null, 2));
    
    if (!functionContent?.function) {
      console.error('DEBUG - Step 14: No function call found in response');
      // Log the actual content we received
      console.log('DEBUG - Step 14: Actual content received:', assistantMessage.content);
      return NextResponse.json({
        message: "I couldn't understand how to process that request. Please try again.",
        calendarUpdated: false
      });
    }

    const { name, arguments: args } = functionContent.function;
    console.log('DEBUG - Step 15: Function name:', name);
    console.log('DEBUG - Step 16: Function arguments:', args);
    
    try {
      const parsedArgs = JSON.parse(args);
      console.log('DEBUG - Step 17: Parsed arguments:', parsedArgs);

      switch (name) {
        case 'delete_events': {
          const { query, date } = parsedArgs;
          const timeRange = getFullDayRange(date);

          const events = await calendar.getEvents(
            decodedCalendarId, 
            timeRange.start,
            timeRange.end
          );

          const matchingEvents = query ? 
            events.filter(event => {
              const eventSummary = event.summary?.toLowerCase() || '';
              const searchWords = query.toLowerCase().split(/\s+/);
              return searchWords.every(word => eventSummary.includes(word));
            }) : 
            events;

          if (matchingEvents.length === 0) {
            return NextResponse.json({
              message: query ? 
                `I couldn't find any events matching "${query}"` :
                "I couldn't find any events in that time period",
              calendarUpdated: false
            });
          }

          for (const event of matchingEvents) {
            if (event.id) {
              await calendar.deleteEvent(decodedCalendarId, event.id);
            }
          }

          return NextResponse.json({
            message: `Deleted ${matchingEvents.length} event(s)${query ? ` matching "${query}"` : ''}`,
            calendarUpdated: true
          });
        }

        case 'create_event': {
          const { summary, date, time, duration = 1, description, recurrence } = parsedArgs;
          const timeRange = createTimeRange(date, time, duration);

          const event = await calendar.createEvent({
            summary,
            description,
            start: {
              dateTime: formatForGoogle(timeRange.start),
              timeZone: 'America/Chicago'
            },
            end: {
              dateTime: formatForGoogle(timeRange.end),
              timeZone: 'America/Chicago'
            },
            recurrence
          }, decodedCalendarId);

          return NextResponse.json({
            message: `Created event "${summary}" from ${timeRange.start.toLocaleString()} to ${timeRange.end.toLocaleString()}`,
            calendarUpdated: true,
            result: event
          });
        }

        default:
          return NextResponse.json({
            message: "I don't know how to handle that type of request yet.",
            calendarUpdated: false
          });
      }

    } catch (error) {
      console.error('DEBUG - Error in function parsing:', error);
      return NextResponse.json({
        message: "Something went wrong. Please try again.",
        error: error.message,
        calendarUpdated: false
      }, { status: 500 });
    }

  } catch (error) {
    console.error('DEBUG - Error in chat endpoint:', error);
    return NextResponse.json({
      message: "Something went wrong. Please try again.",
      error: error.message,
      calendarUpdated: false
    }, { status: 500 });
  }
} 