// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const session = await getSession(req, res);
    
    if (!session) {
      return NextResponse.redirect(`https://auth.thepersuasionacademy.com?returnTo=${encodeURIComponent(req.url)}`);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // If anything fails, redirect to Auth0
    return NextResponse.redirect('https://auth.thepersuasionacademy.com');
  }
}

export const config = {
  matcher: ['/:path*']
}