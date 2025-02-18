import { createHmac } from 'crypto';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Temporary debugging
console.log('Environment check:', {
  hasKey: !!process.env.INTERCOM_SECRET_KEY,
  keyValue: process.env.INTERCOM_SECRET_KEY?.substring(0, 4) + '...',
});

const INTERCOM_SECRET_KEY = process.env.INTERCOM_SECRET_KEY;

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.error('No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!INTERCOM_SECRET_KEY) {
      console.error('Missing INTERCOM_SECRET_KEY in environment');
      return NextResponse.json({ 
        error: 'Intercom secret not configured',
        debug: {
          hasKey: !!process.env.INTERCOM_SECRET_KEY
        }
      }, { status: 500 });
    }

    const userIdentifier = session.user.id.toString();
    const hash = createHmac('sha256', INTERCOM_SECRET_KEY)
      .update(userIdentifier)
      .digest('hex');

    return NextResponse.json({ hash });
  } catch (error) {
    console.error('Hash generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 