// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Skip auth check for API routes and static files
  if (req.nextUrl.pathname.startsWith('/api/auth') || 
      req.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const session = await getSession(req, res);

    if (!session?.user) {
      // Change this to use Auth0's login instead of local route
      // This will trigger the Auth0 Universal Login page
      return NextResponse.redirect(new URL('/api/auth/login?returnTo=' + encodeURIComponent(req.url), req.url));
    }

    return res;
  } catch (error) {
    console.error('Auth error:', error);
    // Same here - use Auth0's login
    return NextResponse.redirect(new URL('/api/auth/login?returnTo=' + encodeURIComponent(req.url), req.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    '/'
  ]
};