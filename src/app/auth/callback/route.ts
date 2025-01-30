import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { session } } = await supabase.auth.getSession()

  // If we have a session or the URL has error parameters,
  // redirect to the main app without any parameters
  if (session || requestUrl.searchParams.has('error')) {
    return NextResponse.redirect('https://app.thepersuasionacademy.com')
  }

  // Otherwise, redirect to login
  return NextResponse.redirect('https://app.thepersuasionacademy.com/auth/login')
} 