import OpenAI from 'openai'

export type CalendarCommand = {
  type: 'CREATE' | 'DELETE' | 'QUERY'
  params: {
    title?: string
    startTime?: string
    endTime?: string
    description?: string
    recurrence?: string[]
  }
}

const SYSTEM_PROMPT = `You are a calendar command parser. Convert natural language into structured calendar commands.
Your response must be a valid JSON object with 'type' and 'params' fields.

For CREATE commands:
- type must be "CREATE"
- params must include title, startTime, and endTime (in ISO format)
- Add 1 hour to endTime from startTime if not specified

For example:
User: "add bible study tomorrow at 6pm"
Response: {
  "type": "CREATE",
  "params": {
    "title": "Bible Study",
    "startTime": "2024-01-24T18:00:00.000Z",
    "endTime": "2024-01-24T19:00:00.000Z"
  }
}

Always ensure:
1. Times are in ISO format with timezone
2. Title is properly capitalized
3. End time is 1 hour after start time if not specified
4. Dates are properly interpreted (tomorrow, next week, etc.)`

export async function parseCommand(message: string): Promise<CalendarCommand> {
  const openai = new OpenAI()
  
  try {
    console.log('Parsing command:', message);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }
    })
    
    const parsedResponse = JSON.parse(response.choices[0].message.content) as CalendarCommand;
    console.log('Parsed response:', parsedResponse);
    
    // Validate the response
    if (!parsedResponse.type || !parsedResponse.params) {
      throw new Error('Invalid command format: missing type or params');
    }
    
    if (parsedResponse.type === 'CREATE' && 
        (!parsedResponse.params.title || !parsedResponse.params.startTime || !parsedResponse.params.endTime)) {
      throw new Error('Invalid CREATE command: missing required parameters');
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing command:', error);
    throw error;
  }
} 