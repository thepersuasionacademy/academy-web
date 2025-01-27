// middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Debug logging
  console.log('Current host:', req.headers.get('host'));
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL:', process.env.VERCEL);

  // Bypass auth for specific GitHub Codespace URL or local development
  const isGitHubDev = req.headers.get('host') === 'cautious-space-barnacle-69grq676rx4gf5vjv-3000.app.github.dev';
  const isLocalDev = !process.env.VERCEL && process.env.NODE_ENV === 'development';
  const isToolRoute = req.nextUrl.pathname.startsWith('/ai/tools/');
  
  console.log('isGitHubDev:', isGitHubDev);
  console.log('isLocalDev:', isLocalDev);
  console.log('isToolRoute:', isToolRoute);

  // Bypass auth for development environments or tool routes in development
  if (isGitHubDev || isLocalDev || (process.env.NODE_ENV === 'development' && isToolRoute)) {
    return NextResponse.next();
  }

  // Production auth flow
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session) {
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api/auth|_next|favicon.ico).*)'
  ]
}