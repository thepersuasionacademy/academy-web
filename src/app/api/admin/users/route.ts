import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all users using the RPC function
    const { data: users, error } = await supabase
      .rpc('get_all_users');

    if (error) {
      console.error('Error fetching users:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in users route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 