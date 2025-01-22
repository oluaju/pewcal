import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    // Create a new assistant with GPT-3.5 Turbo
    const assistant = await openai.beta.assistants.create({
      name: "Chat Assistant",
      instructions: "You are a helpful assistant that answers questions clearly and concisely.",
      model: "gpt-3.5-turbo",
      tools: [{ type: "code_interpreter" }]
    });

    // Store the assistant ID in environment variable or database
    return NextResponse.json({ assistantId: assistant.id });
  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant' },
      { status: 500 }
    );
  }
} 