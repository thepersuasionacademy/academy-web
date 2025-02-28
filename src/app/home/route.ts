import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This route handler will bypass the middleware authentication check
export async function GET(request: NextRequest) {
  // Forward to the page component without authentication check
  const response = NextResponse.next()
  
  // Set a header to indicate this is a public route
  response.headers.set('x-public-route', 'true')
  
  return response
} 