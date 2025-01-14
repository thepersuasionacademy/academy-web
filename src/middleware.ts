// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Don't even try to get a session first, just redirect immediately to Auth0
    // if there's no session cookie
    if (!req.cookies.get('appSession')) {
      return NextResponse.redirect(`https://auth.thepersuasionacademy.com?returnTo=${encodeURIComponent(req.url)}`);
    }

    // Only check session if we have a cookie
    const res = NextResponse.next();
    const session = await getSession(req, res);
    
    if (!session) {
      return NextResponse.redirect(`https://auth.thepersuasionacademy.com?returnTo=${encodeURIComponent(req.url)}`);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect('https://auth.thepersuasionacademy.com');
  }
}

export const config = {
  matcher: ['/:path*']
}