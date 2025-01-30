'use client'

import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        const url = new URL(window.location.href)
        const hasError = url.searchParams.has('error') || url.searchParams.has('error_code')

        if (hasError) {
          const errorDescription = url.searchParams.get('error_description') || 'Authentication failed'
          console.error('Auth error:', errorDescription)
          
          // If they have a session, let them into the app but show the error
          if (session) {
            window.location.replace(`/?error=${encodeURIComponent(errorDescription)}`)
            return
          }
          
          // If no session, send them to login with the error
          window.location.replace(`/auth/login?error=${encodeURIComponent(errorDescription)}`)
          return
        }

        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.search)
        
        if (exchangeError) {
          console.error('Exchange error:', exchangeError)
          throw exchangeError
        }

        // Get the updated session after exchange
        const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession()
        
        if (newSessionError) {
          console.error('New session error:', newSessionError)
          throw newSessionError
        }

        if (newSession) {
          // Successful login - redirect to home
          window.location.replace('/')
        } else {
          // No session after exchange - redirect to login
          window.location.replace('/auth/login?error=Failed to create session')
        }
      } catch (error) {
        console.error('Callback error:', error)
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