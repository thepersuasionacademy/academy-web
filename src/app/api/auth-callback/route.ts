import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Return debug HTML instead of redirecting
  const debugResponse = (message: string, details: any = {}) => {
    const html = `
      <html>
        <body>
          <h1>Auth Debug Info</h1>
          <h2>${message}</h2>
          <pre>${JSON.stringify(details, null, 2)}</pre>
          <hr/>
          <a href="/auth/login">Return to Login</a>
        </body>
      </html>
    `
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    // Check for error from OAuth provider
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    
    if (error || error_description) {
      return debugResponse('OAuth Provider Error', {
        error,
        error_description,
        url: request.url
      })
    }

    // Get the code
    const code = requestUrl.searchParams.get('code')
    if (!code) {
      return debugResponse('No Code Present', {
        searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
        url: request.url
      })
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      return debugResponse('Session Exchange Error', {
        error: {
          message: exchangeError.message,
          status: exchangeError.status,
          name: exchangeError.name
        },
        code: code.substring(0, 10) + '...' // Show part of the code safely
      })
    }

    if (!data.session) {
      return debugResponse('No Session Received', {
        data,
        code: code.substring(0, 10) + '...'
      })
    }

    // If we get here, authentication was successful
    return debugResponse('Authentication Successful', {
      session: {
        user: data.session.user.email,
        expires_at: data.session.expires_at
      }
    })
  } catch (error) {
    return debugResponse('Unexpected Error', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      url: request.url
    })
  }
} 
