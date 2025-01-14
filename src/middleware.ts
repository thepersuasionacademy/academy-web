import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Allow the Auth0 callback to pass through
  if (req.nextUrl.pathname === '/api/auth/callback') {
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const session = await getSession(req, res);

    if (!session) {
      // Use the SDK's login endpoint which handles the Auth0 Universal Login flow
      return NextResponse.redirect(new URL('/api/auth/login', 'https://app.thepersuasionacademy.com'));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/api/auth/login', 'https://app.thepersuasionacademy.com'));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico|api/auth/callback).*)',
  ]
}