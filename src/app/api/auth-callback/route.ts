import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  console.log('Auth callback started, URL:', request.url)

  try {
    // Check for error from OAuth provider
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    
    if (error || error_description) {
      console.log('OAuth provider error:', { error, error_description })
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error_description || error || 'OAuth error')}`
      )
    }

    // Get the code
    const code = requestUrl.searchParams.get('code')
    console.log('Code present:', !!code)
    
    if (!code) {
      console.log('No code in request')
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Authentication code missing')}`
      )
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code
    console.log('Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.log('Session exchange error:', {
        message: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name
      })
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Failed to exchange code: ' + exchangeError.message)}`
      )
    }

    // Check if we got a session
    if (!data.session) {
      console.log('No session received after exchange')
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('No session received')}`
      )
    }

    console.log('Authentication successful, redirecting to home')
    return NextResponse.redirect(requestUrl.origin)
  } catch (error) {
    console.log('Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error during authentication'
    console.log('Error message:', message)
    
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(message)}`
    )
  }
} 
