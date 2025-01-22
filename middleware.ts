import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Get auth token from cookie
  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!accessToken;

  // Paths that require authentication
  const authRequiredPaths = ['/calendar'];

  // Check if the current path requires authentication
  const isAuthRequired = authRequiredPaths.some(authPath => 
    path.startsWith(authPath)
  );

  // If path requires auth and user is not authenticated, redirect to home
  if (isAuthRequired && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure the paths that should be handled by this middleware
export const config = {
  matcher: [
    '/calendar/:path*',
  ],
}; 