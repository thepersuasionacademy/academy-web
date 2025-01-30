import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (!code) {
      console.error('No code provided in callback')
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Redirecting...</title>
            <script>
              window.location.href = "${requestUrl.origin}/auth/login?error=${encodeURIComponent('No authentication code provided')}";
            </script>
          </head>
          <body>
            <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center;">
              <div style="text-align: center;">
                <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Redirecting...</h2>
                <p style="color: #6b7280;">Please wait while we redirect you.</p>
              </div>
            </div>
          </body>
        </html>`,
        {
          headers: { 'content-type': 'text/html' },
        }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Redirecting...</title>
            <script>
              window.location.href = "${requestUrl.origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}";
            </script>
          </head>
          <body>
            <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center;">
              <div style="text-align: center;">
                <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Redirecting...</h2>
                <p style="color: #6b7280;">Please wait while we redirect you.</p>
              </div>
            </div>
          </body>
        </html>`,
        {
          headers: { 'content-type': 'text/html' },
        }
      )
    }

    // Get the session to verify it worked
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Redirecting...</title>
            <script>
              window.location.href = "${requestUrl.origin}/auth/login?error=${encodeURIComponent(sessionError.message)}";
            </script>
          </head>
          <body>
            <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center;">
              <div style="text-align: center;">
                <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Redirecting...</h2>
                <p style="color: #6b7280;">Please wait while we redirect you.</p>
              </div>
            </div>
          </body>
        </html>`,
        {
          headers: { 'content-type': 'text/html' },
        }
      )
    }

    // If we have a session, redirect to the app
    if (session) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Redirecting...</title>
            <script>
              window.location.href = "${requestUrl.origin}";
            </script>
          </head>
          <body>
            <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center;">
              <div style="text-align: center;">
                <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Sign in successful!</h2>
                <p style="color: #6b7280;">Redirecting you to the dashboard...</p>
              </div>
            </div>
          </body>
        </html>`,
        {
          headers: { 'content-type': 'text/html' },
        }
      )
    }

    // If we don't have a session, something went wrong
    console.error('No session after successful code exchange')
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Redirecting...</title>
          <script>
            window.location.href = "${requestUrl.origin}/auth/login?error=${encodeURIComponent('Failed to create session')}";
          </script>
        </head>
        <body>
          <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Redirecting...</h2>
              <p style="color: #6b7280;">Please wait while we redirect you.</p>
            </div>
          </div>
        </body>
      </html>`,
      {
        headers: { 'content-type': 'text/html' },
      }
    )
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Redirecting...</title>
          <script>
            window.location.href = "${new URL(request.url).origin}/auth/login?error=${encodeURIComponent(errorMessage)}";
          </script>
        </head>
        <body>
          <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Redirecting...</h2>
              <p style="color: #6b7280;">Please wait while we redirect you.</p>
            </div>
          </div>
        </body>
      </html>`,
      {
        headers: { 'content-type': 'text/html' },
      }
    )
  }
} 