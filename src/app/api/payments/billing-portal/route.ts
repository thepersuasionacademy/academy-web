import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST() {
  try {
    // Enhanced debug environment variables
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    console.log('Environment check:', {
      hasStripeKey: !!stripeKey,
      nodeEnv: process.env.NODE_ENV,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyPrefix: stripeKey?.substring(0, 7) || 'none',
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
    });

    if (!stripeKey) {
      console.error('Missing STRIPE_SECRET_KEY in environment');
      return NextResponse.json(
        { 
          error: 'Stripe configuration error', 
          details: 'Missing STRIPE_SECRET_KEY in environment',
          debug: {
            env: process.env.NODE_ENV,
            hasKey: !!stripeKey,
            availableEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
            keyPrefix: stripeKey?.substring(0, 7) || 'none',
          }
        }, 
        { status: 500 }
      );
    }

    // Validate key format
    if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
      console.error('Invalid STRIPE_SECRET_KEY format');
      return NextResponse.json(
        { 
          error: 'Stripe configuration error', 
          details: 'Invalid STRIPE_SECRET_KEY format',
          debug: {
            env: process.env.NODE_ENV,
            keyPrefix: stripeKey.substring(0, 7),
          }
        }, 
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    });

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
      { 
        error: 'Failed to create billing portal session',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          env: process.env.NODE_ENV,
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
          stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
        }
      },
      { status: 500 }
    );
  }
} 