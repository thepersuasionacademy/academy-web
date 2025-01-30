import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('[Auth Callback] Received code:', code ? 'exists' : 'missing')

  if (code) {
    const supabase = createRouteHandlerClient({ 
      cookies,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    })
    
    try {
      console.log('[Auth Callback] Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('[Auth Callback] Exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=AuthFailed`)
      }

      console.log('[Auth Callback] Session data:', data)
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('[Auth Callback] Unexpected error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=AuthFailed`)
    }
  }
  
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
} 
