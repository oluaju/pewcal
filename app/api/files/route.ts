import { NextResponse } from 'next/server';
import { openai } from '@/app/assistant-config';

export async function GET() {
  try {
    const files = await openai.files.list();
    return NextResponse.json(files.data);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
} 