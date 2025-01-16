// middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Bypass auth in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Production auth flow
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session) {
    // Simply redirect to login, Auth0 SDK will handle the rest
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    // Protect everything except auth endpoints and static files
    '/((?!api/auth|_next|favicon.ico).*)'
  ]
}