import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Log the received code
    console.log('Received code:', code)
    
    if (!code) {
      console.log('No code provided')
      return new Response('No code provided', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    try {
      console.log('Creating Supabase client...')
      const supabase = createRouteHandlerClient({ cookies })
      
      console.log('Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.log('Exchange error:', error)
        return new Response(`Exchange error: ${error.message}`, {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        })
      }

      console.log('Exchange successful:', data)
      return NextResponse.redirect(requestUrl.origin)
      
    } catch (exchangeError) {
      console.log('Exchange process error:', exchangeError)
      return new Response(`Exchange process error: ${exchangeError instanceof Error ? exchangeError.message : 'Unknown error'}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  } catch (error) {
    console.log('Top level error:', error)
    return new Response(`Top level error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
} 