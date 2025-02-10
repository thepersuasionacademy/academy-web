import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const STORAGE_URL = `https://ny.storage.bunnycdn.com/${STORAGE_ZONE}`;
const CDN_URL = `https://thepersuasionacademycdn.b-cdn.net`;

export async function POST(request: Request) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Authentication error', details: sessionError.message }, { status: 401 });
    }

    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Unauthorized', details: 'No session found' }, { status: 401 });
    }

    // Check if environment variables are set
    if (!STORAGE_PASSWORD || !STORAGE_ZONE) {
      console.error('Missing Bunny.net configuration:', { 
        hasPassword: !!STORAGE_PASSWORD, 
        hasStorageZone: !!STORAGE_ZONE 
      });
      throw new Error('Missing Bunny.net configuration');
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Generate a safe filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const filename = `thumbnails/${timestamp}-${originalName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('Uploading to Bunny.net:', {
      url: `${STORAGE_URL}/${filename}`,
      size: buffer.length,
      storageZone: STORAGE_ZONE
    });

    // Upload to Bunny.net
    const response = await fetch(`${STORAGE_URL}/${filename}`, {
      method: 'PUT',
      headers: {
        'AccessKey': STORAGE_PASSWORD,
        'Content-Type': file.type || 'application/octet-stream',
        'Accept': '*/*'
      },
      body: buffer
    });

    const responseText = await response.text();
    console.log('Bunny.net response:', {
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      headers: Object.fromEntries(response.headers.entries()),
      requestUrl: `${STORAGE_URL}/${filename}`,
      requestHeaders: {
        'AccessKey': STORAGE_PASSWORD.substring(0, 8) + '...',
        'Content-Type': file.type || 'application/octet-stream'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Bunny.net: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const cdnUrl = `${CDN_URL}/${filename}`;
    console.log('Upload successful:', { cdnUrl });

    // Return the CDN URL
    return NextResponse.json({ url: cdnUrl });

  } catch (error: any) {
    console.error('Error uploading file:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error.message
      },
      { status: 500 }
    );
  }
} 