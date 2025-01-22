import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear all authentication-related cookies
    cookieStore.delete('userId');
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in /api/auth/logout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 