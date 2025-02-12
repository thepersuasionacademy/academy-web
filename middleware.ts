import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const debugMiddleware = (req: NextRequest) => {
  console.log('\n=== Middleware Debug ===')
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers))
  console.log('Cookies:', req.cookies.getAll())
  console.log('=====================\n')
}

export async function middleware(req: NextRequest) {
  debugMiddleware(req)
  try {
    const res = NextResponse.next()
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    const supabase = createMiddlewareClient({ 
      req, 
      res
    })

    // Configure cookies after client creation
    if (!isDevelopment) {
      res.cookies.set('sb-auth-token', '', {
        domain: 'app.thepersuasionacademy.com',
        path: '/',
        sameSite: 'lax',
        secure: true
      })
    }

    // Add debug logging
    console.log('Middleware URL:', req.url)
    console.log('Pathname:', req.nextUrl.pathname)

    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth session error:', error)
    }

    // Log session state
    console.log('Session exists:', !!session)

    // Check if this is an admin route
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        // If no session, redirect to login
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }

      // Check if user is admin or super admin
      const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
        supabase.rpc('is_admin'),
        supabase.rpc('is_super_admin')
      ])

      if (!isAdmin && !isSuperAdmin) {
        // If not admin, redirect to home
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Handle other protected routes
    if (!session && req.nextUrl.pathname.startsWith('/protected-route')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Return a basic response instead of crashing
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 