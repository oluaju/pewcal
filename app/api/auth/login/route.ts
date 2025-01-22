import { NextResponse } from 'next/server';
import { getGoogleOAuthURL } from '@/app/utils/google';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Starting login process...');
    
    // Check if user has existing tokens
    const cookieStore = cookies();
    const hasExistingTokens = cookieStore.has('refresh_token');
    
    console.log('Environment check:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasExistingTokens
    });

    // Only force consent for new users
    const url = getGoogleOAuthURL(!hasExistingTokens);
    console.log('Generated auth URL:', url);

    // Redirect to Google OAuth URL
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.redirect('/?error=auth');
  }
} 