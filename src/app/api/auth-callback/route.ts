import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent('No code received')}`
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(error.message)}`
      )
    }

    // Successful authentication
    return NextResponse.redirect(requestUrl.origin)
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )}`
    )
  }
} 
