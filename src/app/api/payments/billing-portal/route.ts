import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});

export async function POST() {
  try {
    // Get authenticated session from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find customer in Stripe by email
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1
    });

    console.log('Stripe customer search result:', customers.data);

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: 'No billing account found. Please contact support to set up your billing account.' 
      }, { status: 404 });
    }

    const stripeCustomerId = customers.data[0].id;

    // Create the billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
} 