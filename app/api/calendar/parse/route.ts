import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request: Request) {
  try {
    const { text, currentTime } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a calendar event parser. Extract event details from the user's request and format them as JSON.
          Current time: ${currentTime}`
        },
        {
          role: "user",
          content: `Parse this calendar request into a JSON object with these fields:
          - title: The event title/description
          - date: ISO string for the event date (YYYY-MM-DD)
          - time: (optional) 24-hour time format (HH:mm)
          - duration: (optional) duration in natural language (e.g., "1 hour", "30 minutes")
          
          Request: ${text}`
        }
      ],
      temperature: 0
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('Failed to parse event details');
    }

    try {
      // Extract JSON from the response
      const jsonStr = result.replace(/```json\n?|\n?```/g, '').trim();
      const parsedEvent = JSON.parse(jsonStr);
      return NextResponse.json(parsedEvent);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse event details');
    }
  } catch (error) {
    console.error('Error parsing event:', error);
    return NextResponse.json(
      { error: 'Failed to parse event details' },
      { status: 500 }
    );
  }
} 