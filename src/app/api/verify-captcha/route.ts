import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const verifyResponse = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY || '',
        response: token
      })
    })

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok || !verifyData.success) {
      return NextResponse.json({ error: 'Invalid captcha' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Captcha verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 