import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    console.error('Content ID is missing from request');
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
  }

  // Get the current user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session error:', sessionError);
    return NextResponse.json({ error: 'Authentication error', details: sessionError }, { status: 401 });
  }

  if (!session) {
    console.error('No session found');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  console.log('Fetching access structure:', {
    content_id: id,
    user_id: session.user.id
  });

  try {
    const { data: accessStructure, error: accessError } = await supabase.rpc(
      'get_content_access_structure',
      {
        p_content_id: id,
        p_user_id: session.user.id
      }
    );

    if (accessError) {
      console.error('Access Structure Error:', {
        message: accessError.message,
        details: accessError.details,
        hint: accessError.hint,
        code: accessError.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch access structure',
        details: {
          message: accessError.message,
          details: accessError.details,
          hint: accessError.hint,
          code: accessError.code
        }
      }, { status: 500 });
    }

    if (!accessStructure) {
      console.error('No access structure returned');
      return NextResponse.json({ error: 'No access structure found' }, { status: 404 });
    }

    console.log('Successfully fetched access structure:', {
      content_id: id,
      has_content: accessStructure !== null,
      module_count: accessStructure.children?.length ?? 0
    });

    return NextResponse.json(accessStructure);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred',
      details: error.message
    }, { status: 500 });
  }
} 