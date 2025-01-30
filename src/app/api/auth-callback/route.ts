import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Force Node.js runtime

export async function GET(request: Request) {
  return new Response('API Route Test', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
} 
