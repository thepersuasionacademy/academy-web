import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
  const videoId = '1e7bb7f1-5b1e-4b9b-b00e-49e1f83c5f19';
  const securityKey = process.env.BUNNY_API_KEY;
  
  if (!securityKey) {
    return NextResponse.json({ error: 'Security key not configured' }, { status: 500 });
  }

  // Generate expiration time (e.g., 1 hour from now)
  const expirationTime = Math.floor(Date.now() / 1000) + 3600;

  // Create the signature base
  const signatureBase = `${libraryId}${videoId}${expirationTime}`;

  // Generate HMAC SHA256 signature
  const signature = crypto
    .createHmac('sha256', securityKey)
    .update(signatureBase)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Construct the signed URL
  const signedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${signature}&expires=${expirationTime}`;

  return NextResponse.json({ url: signedUrl });
} 