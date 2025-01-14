// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    let session;
    
    try {
      session = await getSession(req, res);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect('https://auth.thepersuasionacademy.com');
    }

    if (!session?.user) {
      return NextResponse.redirect('https://auth.thepersuasionacademy.com');
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/(.*)'  // Match all routes
  ]
};