import { NextResponse } from 'next/server';
import { openai } from '@/app/assistant-config';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a proper file object for OpenAI
    const stream = Readable.from(buffer);
    Object.defineProperty(stream, 'name', {
      value: file.name
    });

    const uploadedFile = await openai.files.create({
      file: stream,
      purpose: 'assistants',
    });

    return NextResponse.json(uploadedFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 