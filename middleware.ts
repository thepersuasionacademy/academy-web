import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Improved caching settings - 5 minutes TTL
const sessionCache = new Map<string, { session: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache time

// Track redirect attempts to prevent loops
const redirectAttempts = new Map<string, number>()
const MAX_REDIRECTS = 2
const REDIRECT_WINDOW = 5000 // 5 seconds

export async function middleware(req: NextRequest) {
  // Early return for static assets and API routes
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  // Generate a cache key based on the request cookies related to auth
  const cacheKey = req.cookies
    .getAll()
    .filter(cookie => cookie.name.startsWith('sb-'))
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join(';')

  // Skip auth check completely for public routes
  const isPublicRoute = req.nextUrl.pathname.match(/^\/(public|home|favicon\.ico|robots\.txt|sitemap\.xml)/)
  if (isPublicRoute) {
    return NextResponse.next()
  }

  try {
    // Create a response
    const res = NextResponse.next()
    
    // Only check auth for actual page requests
    if (req.method === 'GET' && req.headers.get('accept')?.includes('text/html')) {
      const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
      
      // Check cache first
      const now = Date.now()
      const cachedData = sessionCache.get(cacheKey)
      let session = null

      if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
        // Use cached session
        session = cachedData.session
        console.log('Using cached session for:', req.nextUrl.pathname)
      } else {
        // Create supabase client only when needed
        const supabase = createMiddlewareClient({ req, res })
        
        try {
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.log('Auth error for path:', req.nextUrl.pathname, 'Error:', error)
            if (error.status === 400 && error.message.includes('expired')) {
              res.cookies.delete('sb-access-token')
              res.cookies.delete('sb-refresh-token')
              
              if (!isAuthRoute) {
                return NextResponse.redirect(new URL('/auth/login', req.url))
              }
            }
            // Don't cache errors
            return res
          }
          
          session = data.session
          
          // Cache the session
          sessionCache.set(cacheKey, {
            session,
            timestamp: now
          })
          
          // Clean up old cache entries periodically (1% chance to run cleanup)
          if (Math.random() < 0.01) {
            for (const [key, value] of sessionCache.entries()) {
              if (now - value.timestamp > CACHE_TTL) {
                sessionCache.delete(key)
              }
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          // Continue without auth on error
          return res
        }
      }

      // Handle auth routes
      if (session && isAuthRoute) {
        return NextResponse.redirect(new URL('/content', req.url))
      }

      // Handle protected routes
      if (!session && !isAuthRoute) {
        const redirectUrl = new URL('/auth/login', req.url)
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Handle admin routes
      if (req.nextUrl.pathname.startsWith('/admin') && session) {
        // Create supabase client only when needed for admin check
        const supabase = createMiddlewareClient({ req, res })
        
        const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
          supabase.rpc('is_admin'),
          supabase.rpc('is_super_admin')
        ])

        if (!isAdmin && !isSuperAdmin) {
          return NextResponse.redirect(new URL('/', req.url))
        }
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
    // Only match GET requests to pages, exclude static files and API routes
    {
      source: '/((?!_next/static|_next/image|favicon.ico|public|home|assets|images|fonts|api).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
} 