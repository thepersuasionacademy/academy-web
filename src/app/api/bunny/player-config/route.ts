import { NextResponse } from 'next/server';

export async function GET() {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
  const token = process.env.NEXT_PUBLIC_BUNNY_SECURITY_TOKEN;
  
  // Debug log the actual values
  console.log('DEBUG VALUES:', {
    libraryId,
    token,
    rawEnvValues: {
      libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID,
      token: process.env.NEXT_PUBLIC_BUNNY_SECURITY_TOKEN
    }
  });

  if (!token || !libraryId) {
    return NextResponse.json({ 
      error: 'Missing required configuration',
      debug: { hasToken: !!token, hasLibraryId: !!libraryId }
    }, { status: 500 });
  }

  return NextResponse.json({
    libraryId,
    token
  });
}