import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // If there's no code, this is not an OAuth callback
    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('No authentication code provided')}`
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Get the session to verify it worked
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(sessionError.message)}`
      )
    }

    // If we have a session, redirect to the app
    if (session) {
      return NextResponse.redirect(requestUrl.origin)
    }

    // If we don't have a session, something went wrong
    console.error('No session after successful code exchange')
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Failed to create session')}`
    )
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    )
  }
} 