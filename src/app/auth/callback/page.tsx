'use client'

import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.replace(`/auth/login?error=${encodeURIComponent(sessionError.message)}`)
          return
        }

        if (session) {
          router.replace('/')
          return
        }

        // If we don't have a session, check for error params
        const url = new URL(window.location.href)
        const error = url.searchParams.get('error')
        
        if (error) {
          console.error('Auth error:', error)
          router.replace(`/auth/login?error=${encodeURIComponent(error)}`)
          return
        }

        // If no session and no error, redirect to login
        router.replace('/auth/login')
      } catch (error) {
        console.error('Callback error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
        router.replace(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
      }
    }

    handleCallback()
  }, [supabase.auth, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Completing sign in...</h2>
        <p className="text-sm text-gray-500">Please wait while we verify your credentials.</p>
      </div>
    </div>
  )
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