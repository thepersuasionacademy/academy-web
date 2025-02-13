import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    // Enhanced debug environment variables
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const envDebug = {
      hasStripeKey: !!stripeKey,
      nodeEnv: process.env.NODE_ENV,
      stripeKeyLength: stripeKey?.length || 0,
      stripeKeyPrefix: stripeKey?.substring(0, 7) || 'none',
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
      vercelEnv: process.env.VERCEL_ENV,
      isVercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION,
    };
    
    console.log('Environment check:', JSON.stringify(envDebug, null, 2));

    if (!stripeKey) {
      console.error('Missing STRIPE_SECRET_KEY in environment:', JSON.stringify(envDebug, null, 2));
      return NextResponse.json(
        { 
          error: 'Stripe configuration error', 
          details: 'Missing STRIPE_SECRET_KEY in environment',
          debug: {
            ...envDebug,
            timestamp: new Date().toISOString(),
          }
        }, 
        { status: 500 }
      );
    }

    // Validate key format
    if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
      console.error('Invalid STRIPE_SECRET_KEY format:', JSON.stringify(envDebug, null, 2));
      return NextResponse.json(
        { 
          error: 'Stripe configuration error', 
          details: 'Invalid STRIPE_SECRET_KEY format',
          debug: {
            ...envDebug,
            timestamp: new Date().toISOString(),
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

    // Get userId from request body
    const { userId } = await request.json();

    // Get user's email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Searching for Stripe customer with email:', userData.email);

    // Try to find customer in Stripe by email
    const customers = await stripe.customers.list({
      email: userData.email,
      limit: 1
    });

    console.log('Stripe customer search result:', {
      found: customers.data.length > 0,
      email: userData.email,
      customersCount: customers.data.length,
      firstCustomer: customers.data[0] ? {
        id: customers.data[0].id,
        email: customers.data[0].email,
        name: customers.data[0].name,
      } : null
    });

    let stripeCustomerId: string;

    if (customers.data.length === 0) {
      // Create a new customer in Stripe
      const newCustomer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          userId: userId
        }
      });
      
      stripeCustomerId = newCustomer.id;
      
      console.log('Created new Stripe customer:', {
        id: newCustomer.id,
        email: newCustomer.email
      });
    } else {
      stripeCustomerId = customers.data[0].id;
    }

    // Create the billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: request.headers.get('referer') || `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
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