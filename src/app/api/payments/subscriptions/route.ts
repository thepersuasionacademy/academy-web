import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
});

export async function GET() {
  try {
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

    // Get subscriptions and invoices
    const [subscriptions, invoices] = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.items.data.price'],
        limit: 100
      }),
      stripe.invoices.list({
        customer: customerId,
        limit: 100,
        expand: ['data.subscription']
      })
    ]);

    // Get product details
    const productIds = [
      ...new Set(
        subscriptions.data.flatMap(sub => 
          sub.items.data.map(item => item.price.product as string)
        )
      )
    ];
    const products = await stripe.products.list({ ids: productIds });
    const productMap = new Map(products.data.map(p => [p.id, p.name]));

    // Transform data
    const subscriptionPayments = invoices.data.map(invoice => {
      const sub = subscriptions.data.find(s => s.id === invoice.subscription);
      const item = sub?.items.data[0];
      const productId = item?.price.product as string;

      return {
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        status: invoice.status,
        timestamp: new Date(invoice.created * 1000).toISOString(),
        paymentType: 'subscription',
        receipt: invoice.hosted_invoice_url,
        name: productMap.get(productId) || 'Subscription',
        category: 'Subscription',
        suite: 'Academy',
        billingCycle: item?.price.recurring?.interval
      };
    });

    const activeSubscriptions = subscriptions.data.map(sub => {
      const item = sub.items.data[0];
      const productId = item.price.product as string;

      return {
        id: sub.id,
        amount: item.price.unit_amount! / 100,
        status: sub.status,
        timestamp: new Date(sub.created * 1000).toISOString(),
        paymentType: 'subscription',
        receipt: (sub.latest_invoice as Stripe.Invoice)?.hosted_invoice_url || null,
        name: productMap.get(productId) || 'Subscription',
        category: 'Subscription',
        suite: 'Academy',
        billingCycle: item.price.recurring?.interval
      };
    });

    const payments = [...subscriptionPayments, ...activeSubscriptions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 