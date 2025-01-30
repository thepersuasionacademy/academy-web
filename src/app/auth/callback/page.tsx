import { headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code

  // If there's no code, this is not an OAuth callback
  if (!code) {
    console.error('No code provided in callback')
    redirect(`/auth/login?error=${encodeURIComponent('No authentication code provided')}`)
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      redirect(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
    }

    // Get the session to verify it worked
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      redirect(`/auth/login?error=${encodeURIComponent(sessionError.message)}`)
    }

    // If we have a session, redirect to the app
    if (session) {
      redirect('/')
    }

    // If we don't have a session, something went wrong
    console.error('No session after successful code exchange')
    redirect(`/auth/login?error=${encodeURIComponent('Failed to create session')}`)
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    redirect(`/auth/login?error=${encodeURIComponent(errorMessage)}`)
  }

  // This is just for TypeScript, the code will never reach here due to redirects
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