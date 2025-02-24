// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache duration in milliseconds (5 seconds)
const CACHE_DURATION = 5000

// In-memory cache for sessions
const sessionCache = new Map<string, { session: any; timestamp: number }>()

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  try {
    // Generate a cache key based on the request cookies
    const cacheKey = req.cookies.toString()
    const now = Date.now()
    const cachedData = sessionCache.get(cacheKey)

    // Check if we have a valid cached session
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      // Use cached session
      const session = cachedData.session
      
      // Public paths that don't require auth
      const publicPaths = ['/auth/login', '/auth/callback', '/api/auth-callback']
      const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

      // If no session and trying to access protected route
      if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // If they have a session and trying to access auth pages
      if (session && req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      return res
    }

    // If no cache hit, fetch new session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Cache the new session
    sessionCache.set(cacheKey, {
      session,
      timestamp: now
    })

    // Clean up old cache entries
    for (const [key, value] of sessionCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        sessionCache.delete(key)
      }
    }

    // Public paths that don't require auth
    const publicPaths = ['/auth/login', '/auth/callback', '/api/auth-callback']
    const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path))

    // If no session and trying to access protected route
    if (!session && !isPublicPath) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // If they have a session and trying to access auth pages
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Add auth layout path to response headers
    if (req.nextUrl.pathname.startsWith('/auth')) {
      res.headers.set('x-use-auth-layout', 'true')
    }

    return res
  } catch (err) {
    console.error('Middleware unexpected error:', err)
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

// Specify which routes to run the middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/public).*)',
  ],
}