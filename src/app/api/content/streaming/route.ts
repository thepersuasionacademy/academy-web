import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('get_streaming_content_by_suite_id', {
    p_suite_id: id
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }

  return NextResponse.json(data);
} 