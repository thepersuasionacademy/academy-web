import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    // Verify endpoints exist
    const endpoints = [
      new URL('/api/payments/one-time', baseUrl).toString(),
      new URL('/api/payments/subscriptions', baseUrl).toString()
    ];
    console.log('Fetching from:', endpoints);

    const [oneTimeRes, subscriptionsRes] = await Promise.all([
      fetch(endpoints[0], { headers: { 'Content-Type': 'application/json' } }),
      fetch(endpoints[1], { headers: { 'Content-Type': 'application/json' } })
    ]);

    // Check response content types
    const oneTimeContentType = oneTimeRes.headers.get('Content-Type');
    const subsContentType = subscriptionsRes.headers.get('Content-Type');
    
    if (!oneTimeContentType?.includes('application/json') || !subsContentType?.includes('application/json')) {
      const oneTimeText = await oneTimeRes.text();
      const subsText = await subscriptionsRes.text();
      throw new Error(`Invalid content types. One-time: ${oneTimeContentType} (${oneTimeText.slice(0, 100)}...), Subscriptions: ${subsContentType} (${subsText.slice(0, 100)}...)`);
    }

    const { payments: oneTimePayments } = await oneTimeRes.json();
    const { payments: subscriptionPayments } = await subscriptionsRes.json();

    const allPayments = [...oneTimePayments, ...subscriptionPayments]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ payments: allPayments }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Combined payments error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch combined payments',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 