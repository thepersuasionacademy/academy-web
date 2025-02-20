import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if this is an admin route
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
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

    // For non-admin routes that need auth
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    
    // Protected routes (everything except webhooks and static assets)
    '/((?!api/webhooks|api/intercom|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 