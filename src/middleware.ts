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
      const loginUrl = new URL('/api/auth/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    return res;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    '/'
  ]
};