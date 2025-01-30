import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, hash } = new URL(request.url)
  
  // Check if this is an auth error
  if (searchParams.has('error') || searchParams.has('error_code')) {
    // Get error description from either search params or hash
    let errorDescription = searchParams.get('error_description')
    
    // If error description is in the hash, parse it
    if (!errorDescription && hash) {
      const hashParams = new URLSearchParams(hash.substring(1))
      errorDescription = hashParams.get('error_description')
    }

    // Redirect to login with error
    const loginUrl = new URL('/auth/login', 'https://app.thepersuasionacademy.com')
    loginUrl.searchParams.set('error', errorDescription || 'Authentication failed')
    
    return NextResponse.redirect(loginUrl)
  }

  // If not an error, continue normal flow
  return NextResponse.next()
} 