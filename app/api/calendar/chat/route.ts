import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { openai } from '@/app/assistant-config';
import { GoogleCalendarClient } from '@/app/utils/google-calendar';
import { ensureAssistant } from '@/app/utils/ensure-assistant';

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

function isFunctionCall(content: MessageContent): content is MessageContent & { type: 'function'; function: { name: string; arguments: string } } {
  return (
    content.type === 'function' &&
    content.function !== undefined &&
    typeof content.function.name === 'string' &&
    typeof content.function.arguments === 'string'
  );
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    console.log('Step 1: Received message:', message);

    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const encodedCalendarId = cookieStore.get('google_calendar_id')?.value;

    console.log('Step 2: Auth check:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasCalendarId: !!encodedCalendarId
    });

    if (!accessToken) {
      return NextResponse.json({
        message: "You need to authenticate with Google Calendar first.",
        error: "No access token available",
        needsAuth: true,
        authUrl: '/api/auth/login'
      }, { status: 401 });
    }

    if (!encodedCalendarId) {
      return NextResponse.json({
        message: "Please select a calendar first.",
        error: "No calendar selected",
        status: 400
      });
    }

    // Decode the calendar ID before using it
    const googleCalendarId = decodeURIComponent(encodedCalendarId);
    console.log('Step 3: Using calendar ID:', {
      encoded: encodedCalendarId,
      decoded: googleCalendarId
    });

    let calendarService;
    try {
      calendarService = new GoogleCalendarClient(accessToken, refreshToken);
      console.log('Step 4: Calendar service initialized');
    } catch (error) {
      console.error('Failed to initialize calendar service:', error);
      return NextResponse.json({
        message: "Failed to connect to Google Calendar. Please authenticate again.",
        error: error.message,
        needsAuth: true,
        authUrl: '/api/auth/login'
      }, { status: 401 });
    }

    // Get or create assistant
    const assistantId = await ensureAssistant();
    console.log('Step 5: Using assistant:', assistantId);

    // Create a thread
    const thread = await openai.beta.threads.create();
    console.log('Step 6: Created thread:', thread.id);

    // Add the message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });
    console.log('Step 7: Added message to thread');

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    console.log('Step 8: Started assistant run:', run.id);

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      console.log('Step 9: Run status:', runStatus.status);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status !== 'completed') {
      console.error('Step 10: Assistant run failed:', runStatus);
      return NextResponse.json({
        message: "I had trouble processing your request. Please try again.",
        error: `Assistant run failed: ${runStatus.status}`
      }, { status: 500 });
    }
    console.log('Step 10: Run completed with status:', runStatus.status);

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data[0] as AssistantMessage;
    console.log('Step 11: Assistant response:', JSON.stringify(assistantMessage, null, 2));
    
    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      console.error('Step 12: No response content');
      return NextResponse.json({
        message: "I didn't get a response. Please try again.",
        error: "No response from assistant"
      }, { status: 500 });
    }

    // Check for function calls
    const content = assistantMessage.content[0];
    console.log('Step 12: Content type:', content.type);
    console.log('Step 12: Full content:', JSON.stringify(content, null, 2));

    if (content.type === 'function') {
      const functionCall = content.function;
      console.log('Step 13: Function call:', JSON.stringify(functionCall, null, 2));

      switch (functionCall.name) {
        case 'create_event': {
          const args = JSON.parse(functionCall.arguments);
          console.log('Step 14: Create event args:', args);

          // Add timezone to start and end times
          const event = await calendarService.createEvent({
            summary: args.summary,
            description: args.description,
            start: {
              dateTime: new Date(args.start).toISOString(),
              timeZone: 'America/Chicago'
            },
            end: {
              dateTime: new Date(args.end).toISOString(),
              timeZone: 'America/Chicago'
            },
            recurrence: args.recurrence,
          }, googleCalendarId);
          console.log('Step 15: Created event:', event);

          return NextResponse.json({
            message: `Created event: ${event.summary}`,
            eventUpdated: true
          });
        }

        case 'delete_events': {
          const args = JSON.parse(functionCall.arguments);
          console.log('Step 14: Delete events args:', args);
          const events = await calendarService.getEvents(googleCalendarId, {
            timeMin: new Date(args.startDate),
            timeMax: new Date(args.endDate),
            q: args.query
          });

          if (!events || events.length === 0) {
            return NextResponse.json({
              message: "No matching events found to delete."
            });
          }

          let deletedCount = 0;
          for (const event of events) {
            try {
              await calendarService.deleteEvent(googleCalendarId, event.id);
              deletedCount++;
            } catch (error) {
              console.error(`Failed to delete event ${event.id}:`, error);
            }
          }
          console.log('Step 15: Deleted events count:', deletedCount);

          return NextResponse.json({
            message: `Deleted ${deletedCount} event(s)`,
            eventUpdated: true
          });
        }

        case 'query_calendar': {
          const args = JSON.parse(functionCall.arguments);
          console.log('Step 14: Query calendar args:', args);
          const events = await calendarService.getEvents(googleCalendarId, {
            timeMin: new Date(args.startDate),
            timeMax: new Date(args.endDate)
          });

          if (args.type === 'availability') {
            // TODO: Implement availability checking logic
            return NextResponse.json({
              message: "Availability checking is not implemented yet"
            });
          }

          if (args.type === 'schedule') {
            if (!events || events.length === 0) {
              return NextResponse.json({
                message: "No events found in that time period."
              });
            }

            const eventList = events.map(event => {
              const start = new Date(event.start.dateTime || event.start.date);
              return `- ${event.summary} at ${start.toLocaleString()}`;
            }).join('\n');
            console.log('Step 15: Found events:', eventList);

            return NextResponse.json({
              message: `Here are your events:\n${eventList}`
            });
          }
        }
      }
    }

    console.log('Step 13: No function call found in response');
    // If we got here, we don't know how to handle the response
    return NextResponse.json({
      message: content.type === 'text' ? content.text.value : "I'm not sure how to handle that request. Please try rephrasing it."
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json({
      message: "Something went wrong. Please try again.",
      error: error.message
    }, { status: 500 });
  }
} 