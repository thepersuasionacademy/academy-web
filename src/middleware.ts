import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const session = await getSession(req, res);

    if (!session) {
      // Get the Auth0 login URL from environment variables
      const auth0LoginUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/authorize`
        + `?response_type=code`
        + `&client_id=${process.env.AUTH0_CLIENT_ID}`
        + `&redirect_uri=${encodeURIComponent(process.env.AUTH0_BASE_URL + '/api/auth/callback')}`
        + `&scope=openid profile email`
        + `&returnTo=${encodeURIComponent(req.url)}`;

      return NextResponse.redirect(auth0LoginUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Redirect to Auth0's login page on error
    return NextResponse.redirect(`${process.env.AUTH0_ISSUER_BASE_URL}/authorize`);
  }
}

export const config = {
  matcher: [
    // Protect all routes except Next.js static files and the Auth0 callback
    '/((?!_next/static|favicon.ico|api/auth/callback).*)',
  ]
}