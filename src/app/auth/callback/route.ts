import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  console.log('CALLBACK ROUTE HIT')
  
  try {
    return new Response('Auth callback test', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Basic test failed:', error)
    return new Response('Error in test', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
} 