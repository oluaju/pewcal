import OpenAI from 'openai';

// Add debugging to check if env vars are loaded
const apiKey = process.env.OPENAI_API_KEY;
console.log('API Key length:', apiKey?.length);
console.log('API Key prefix:', apiKey?.substring(0, 3));

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

// Make assistant ID optional since we'll create it if it doesn't exist
export const assistantId = process.env.OPENAI_ASSISTANT_ID;

export const openai = new OpenAI({
  apiKey: apiKey,
});

export const MODEL = "gpt-3.5-turbo";
