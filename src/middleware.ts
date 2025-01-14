// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/auth') || 
      req.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const session = await getSession(req, res);

    if (!session?.user) {
      // Redirect directly to your custom Auth0 domain
      const loginUrl = new URL('https://auth.thepersuasionacademy.com');
      loginUrl.searchParams.set('state', req.url); // Preserve return URL
      return NextResponse.redirect(loginUrl);
    }

    return res;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect('https://auth.thepersuasionacademy.com');
  }
}