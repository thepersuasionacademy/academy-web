// src/middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);
  
  if (!session) {
    return NextResponse.redirect(`https://auth.thepersuasionacademy.com?returnTo=${encodeURIComponent(req.url)}`);
  }

  return res;
}

export const config = {
  matcher: ['/:path*']
}