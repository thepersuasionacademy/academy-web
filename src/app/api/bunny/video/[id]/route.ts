import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const videoId = params.id;
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
  const token = process.env.NEXT_PUBLIC_BUNNY_SECURITY_TOKEN;

  if (!token) {
    return NextResponse.json({
      error: 'Security token is missing',
      config: { videoId, libraryId }
    }, { status: 401 });
  }

  try {
    // Construct the video URL that we want to get oEmbed data for
    const videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
    
    // Construct the oEmbed URL with the necessary parameters
    const oEmbedUrl = new URL('https://video.bunnycdn.com/OEmbed');
    oEmbedUrl.searchParams.append('url', videoUrl);
    oEmbedUrl.searchParams.append('token', token);
    // Optional parameters for customizing the embed
    oEmbedUrl.searchParams.append('maxWidth', '1280');
    oEmbedUrl.searchParams.append('maxHeight', '720');

    console.log('Making request to:', oEmbedUrl.toString());

    const response = await fetch(oEmbedUrl.toString(), {
      headers: {
        'Accept': 'application/json'
      },
      method: 'GET',
      cache: 'no-store'
    });

    // Get the raw response text first
    const responseText = await response.text();
    console.log('Raw API Response Status:', response.status, response.statusText);
    console.log('Raw API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    // Only log first 500 chars to avoid overwhelming logs
    const truncatedResponse = responseText.substring(0, 500);
    console.log('Raw API Response Text:', truncatedResponse);

    // Check for HTML response which indicates auth issues
    if (responseText.includes('<!DOCTYPE html>')) {
      return NextResponse.json({
        error: 'Authentication failed with Bunny.net API',
        status: response.status,
        statusText: response.statusText,
        details: 'Received HTML instead of JSON. This usually indicates an authentication error.',
        requestInfo: {
          url: oEmbedUrl.toString(),
          method: 'GET'
        }
      }, { status: 401 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({
        error: 'Invalid JSON response from Bunny API',
        status: response.status,
        statusText: response.statusText,
        rawResponse: truncatedResponse,
        requestInfo: {
          url: oEmbedUrl.toString(),
          method: 'GET'
        }
      }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json({
        error: 'Bunny API request failed',
        status: response.status,
        statusText: response.statusText,
        details: data,
        requestInfo: {
          url: oEmbedUrl.toString(),
          method: 'GET'
        }
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data,
      requestInfo: {
        url: oEmbedUrl.toString(),
        method: 'GET'
      }
    });
  } catch (error) {
    console.error('API Route Error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      config: {
        videoId,
        libraryId,
        tokenPresent: !!token
      }
    }, { status: 500 });
  }
} 