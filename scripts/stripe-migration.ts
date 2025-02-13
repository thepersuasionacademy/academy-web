import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion
});

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateStripeData() {
    try {
        // Get all customers
        const customers = await stripe.customers.list({
            limit: 100,
            expand: ['data.default_source']
        });

        console.log(`Found ${customers.data.length} customers to process`);

        for (const customer of customers.data) {
            if (!customer.email) {
                console.log('Skipping customer with no email');
                continue;
            }

            console.log(`\nProcessing customer: ${customer.email}`);

            try {
                // Get customer's payment methods
                const paymentMethods = await stripe.paymentMethods.list({
                    customer: customer.id,
                    type: 'card'
                });

                // Get customer's subscriptions
                const subscriptions = await stripe.subscriptions.list({
                    customer: customer.id,
                    status: 'all',
                    expand: ['data.default_payment_method', 'data.items.data.price']
                });

                // Prepare the data for migration
                const stripeData = {
                    customer_id: customer.id,
                    default_payment_method: {
                        id: paymentMethods.data[0]?.id,
                        card: paymentMethods.data[0]?.card,
                        metadata: {
                            stripe_customer_id: customer.id,
                            stripe_email: customer.email
                        }
                    },
                    subscriptions: subscriptions.data.map(sub => ({
                        id: sub.id,
                        status: sub.status,
                        plan: {
                            nickname: sub.items.data[0]?.price?.nickname || 'Default Plan',
                            amount: sub.items.data[0]?.price?.unit_amount || 0,
                            currency: sub.currency,
                            interval: sub.items.data[0]?.price?.recurring?.interval || 'month'
                        },
                        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                        billing_cycle_anchor: new Date(sub.billing_cycle_anchor * 1000).toISOString(),
                        start_date: new Date(sub.start_date * 1000).toISOString(),
                        items: {
                            total_count: sub.items.data.length
                        },
                        latest_invoice: {
                            payment_intent: sub.latest_invoice
                        },
                        metadata: {
                            ...sub.metadata,
                            stripe_customer_id: customer.id,
                            stripe_email: customer.email
                        }
                    }))
                };

                // Create stripe customer mapping first
                const { error: mappingError } = await supabase
                    .from('stripe_customer_mapping')
                    .upsert({
                        stripe_customer_id: customer.id,
                        stripe_email: customer.email,
                        is_migrated: false
                    });

                if (mappingError) {
                    console.log(`Mapping already exists for ${customer.email}`);
                }

                // Call the migration function
                const { data: result, error } = await supabase.rpc(
                    'migrate_stripe_data_for_user',
                    {
                        stripe_data: stripeData
                    }
                );

                if (error) {
                    console.error(`Error migrating data for ${customer.email}:`, error);
                } else {
                    console.log(`Successfully migrated data for ${customer.email}:`, result);

                    // Update the mapping to mark as migrated
                    await supabase
                        .from('stripe_customer_mapping')
                        .update({ is_migrated: true })
                        .eq('stripe_customer_id', customer.id);
                }
            } catch (error) {
                console.error(`Error processing customer ${customer.email}:`, error);
            }
        }

        console.log('\nMigration completed');

    } catch (error) {
        console.error('Error in migration:', error);
    }
}

// Run the migration
migrateStripeData(); 