import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Log incoming request details
    console.log('Auth callback received:', {
      url: request.url,
      code: code ? 'present' : 'missing',
      error,
      error_description
    })

    if (error) {
      console.error('OAuth error:', { error, error_description })
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error_description || error)}`
      )
    }

    if (!code) {
      console.error('No code in callback')
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('No code received')}`
      )
    }

    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', {
          message: exchangeError.message,
          stack: exchangeError.stack,
          details: exchangeError
        })
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      // Successful authentication
      console.log('Authentication successful, redirecting to home')
      return NextResponse.redirect(requestUrl.origin)
    } catch (exchangeError) {
      console.error('Unexpected exchange error:', {
        error: exchangeError,
        stack: exchangeError instanceof Error ? exchangeError.stack : undefined
      })
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Failed to exchange code for session')}`
      )
    }
  } catch (error) {
    console.error('Callback error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined
    })
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    )
  }
} 