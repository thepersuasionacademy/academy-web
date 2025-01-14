// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const session = await getSession(req, res);
    
    // Get the Auth0 issuer URL, falling back to a default if not set
    const auth0Url = process.env.AUTH0_ISSUER_BASE_URL || 'https://your-tenant.us.auth0.com';
    
    if (!session) {
      return NextResponse.redirect(new URL(`${auth0Url}/authorize?returnTo=${encodeURIComponent(req.url)}`));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/:path*']
}