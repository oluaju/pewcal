import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();
  
  // Create response that redirects to root URL
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  
  // List of all cookies to clear
  const cookiesToClear = [
    'access_token',
    'refresh_token',
    'google_calendar_id',
    'user_id',
    'token_expiry'
  ];

  // Clear each cookie with proper attributes to ensure deletion
  cookiesToClear.forEach(name => {
    // First try to delete
    response.cookies.delete(name);
    
    // Then also set to empty with expired date as backup
    response.cookies.set(name, '', {
      expires: new Date(0),
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    });
  });

  // Also clear any existing cookies in the store
  cookiesToClear.forEach(name => {
    if (cookieStore.get(name)) {
      cookieStore.delete(name);
    }
  });
  
  return response;
} 