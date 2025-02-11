import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectUrl = new URL('/auth/callback', url.origin)
  
  // Copy all search parameters and hash from the original URL
  redirectUrl.search = url.search
  redirectUrl.hash = url.hash

  return NextResponse.redirect(redirectUrl)
} 