import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

export async function GET() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    });

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get customer ID
    const customer = await stripe.customers.list({
      email: session.user.email,
      limit: 1
    });
    if (!customer.data.length) return NextResponse.json({ payments: [] });
    const customerId = customer.data[0].id;

    // Get one-time charges
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
      created: { gte: Math.floor(Date.now() / 1000) - 365*24*60*60 }
    });

    // Filter and transform
    const payments = charges.data
      .filter(charge => !charge.invoice)
      .map(charge => ({
        id: charge.id,
        amount: charge.amount / 100,
        status: charge.status,
        timestamp: new Date(charge.created * 1000).toISOString(),
        paymentType: 'one-time',
        receipt: charge.receipt_url,
        name: charge.description || 'One-time Payment',
        category: 'Purchase',
        suite: 'Academy'
      }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('One-time payments error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch one-time payments',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 