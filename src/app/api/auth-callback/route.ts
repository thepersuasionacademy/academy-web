import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  
  console.log('[Auth Callback] Request URL:', requestUrl.toString())
  console.log('[Auth Callback] Code:', code ? 'exists' : 'missing')
  console.log('[Auth Callback] Error:', error || 'none')

  if (error) {
    console.error('[Auth Callback] Error from auth provider:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error('[Auth Callback] No code provided')
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent('No authorization code provided')}`)
  }

  try {
    const supabase = createRouteHandlerClient({ 
      cookies,
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    })
    
    console.log('[Auth Callback] Exchanging code for session...')
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('[Auth Callback] Session exchange error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(sessionError.message)}`)
    }

    if (!data.session) {
      console.error('[Auth Callback] No session data received')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent('No session data received')}`)
    }

    console.log('[Auth Callback] Session established successfully')
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)

  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Unexpected error during authentication')}`
    )
  }
} 
