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
    const supabase = createMiddlewareClient({ 
      req, 
      res,
      options: {
        cookies: {
          name: 'sb-auth-token',
          domain: 'app.thepersuasionacademy.com',
          path: '/',
          sameSite: 'lax',
          secure: true
        }
      }
    })

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