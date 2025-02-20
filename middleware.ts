import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    // Create a response and supabase client
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the request is for an auth route
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')

    // If the user is signed in and trying to access auth routes, redirect to app
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/content', req.url))
    }

    // If user is not signed in and trying to access protected routes, redirect to login
    if (!session && !isAuthRoute && !isApiRoute) {
      const redirectUrl = new URL('/auth/login', req.url)
      // Add the original URL as a query parameter to redirect back after login
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if this is an admin route
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Check if user is admin or super admin
      const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
        supabase.rpc('is_admin'),
        supabase.rpc('is_super_admin')
      ])

      if (!isAdmin && !isSuperAdmin) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all routes except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
} 