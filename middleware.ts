import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache the session check results for 1 minute
const sessionCache = new Map<string, { session: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute

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

  console.log('Middleware processing request for:', req.nextUrl.pathname)

  try {
    // Create a response and supabase client
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
    const isPublicRoute = req.nextUrl.pathname.match(/^\/(public|favicon\.ico|robots\.txt|sitemap\.xml)/)

    if (isPublicRoute) {
      return res
    }

    // Only check auth for actual page requests
    if (req.method === 'GET' && req.headers.get('accept')?.includes('text/html')) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.log('Auth error for path:', req.nextUrl.pathname, 'Error:', error)
          if (error.status === 400 && error.message.includes('expired')) {
            res.cookies.delete('sb-access-token')
            res.cookies.delete('sb-refresh-token')
            
            if (!isAuthRoute) {
              return NextResponse.redirect(new URL('/auth/login', req.url))
            }
          }
          return res
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
        if (req.nextUrl.pathname.startsWith('/admin')) {
          if (!session) {
            return NextResponse.redirect(new URL('/auth/login', req.url))
          }

          const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
            supabase.rpc('is_admin'),
            supabase.rpc('is_super_admin')
          ])

          if (!isAdmin && !isSuperAdmin) {
            return NextResponse.redirect(new URL('/', req.url))
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Continue without auth on error
        return res
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
      source: '/((?!_next/static|_next/image|favicon.ico|public|assets|images|fonts|api).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
} 