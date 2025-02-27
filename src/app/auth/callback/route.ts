import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const redirectTo = requestUrl.searchParams.get('redirectTo')

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent('No authorization code provided')}`)
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError) {
      console.error('Session exchange error:', authError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(authError.message)}`)
    }

    // If there's a redirectTo parameter, use it, otherwise default to /content
    const redirectPath = redirectTo || '/content'
    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`)

  } catch (err) {
    console.error('Unexpected callback error:', err)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Unexpected error during authentication')}`
    )
  }
} 