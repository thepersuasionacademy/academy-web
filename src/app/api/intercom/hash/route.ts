import { createHmac } from 'crypto';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const INTERCOM_SECRET_KEY = process.env.INTERCOM_SECRET_KEY;

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!INTERCOM_SECRET_KEY) {
      return NextResponse.json({ error: 'Intercom secret not configured' }, { status: 500 });
    }

    const userIdentifier = session.user.id.toString();
    const hash = createHmac('sha256', INTERCOM_SECRET_KEY)
      .update(userIdentifier)
      .digest('hex');

    return NextResponse.json({ hash });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
} 