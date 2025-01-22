import { NextResponse } from 'next/server';
import { openai } from '@/app/assistant-config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createReadStream } from 'fs';

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

    // Create a temporary file
    const tempPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
    writeFileSync(tempPath, buffer);

    const uploadedFile = await openai.files.create({
      file: createReadStream(tempPath),
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