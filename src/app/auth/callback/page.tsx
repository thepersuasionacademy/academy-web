'use client'

import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const url = new URL(window.location.href)
      const hasError = url.searchParams.has('error') || url.searchParams.has('error_code')

      if (hasError) {
        const errorDescription = url.searchParams.get('error_description') || 'Authentication failed'
        
        // If they have a session, let them into the app but show the error
        if (session) {
          window.location.replace(`/?error=${encodeURIComponent(errorDescription)}`)
          return
        }
        
        // If no session, send them to login with the error
        window.location.replace(`/auth/login?error=${encodeURIComponent(errorDescription)}`)
        return
      }

      try {
        await supabase.auth.exchangeCodeForSession(window.location.search)
        window.location.replace('/')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
        window.location.replace(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
      }
    }

    handleCallback()
  }, [supabase.auth])

  return null
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}