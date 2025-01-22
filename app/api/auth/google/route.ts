import { NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/app/utils/google';

export async function GET() {
  const url = getGoogleOAuthURL();
  return NextResponse.redirect(url);
} 