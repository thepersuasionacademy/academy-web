import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Format and use the live key directly
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('Supabase client initialized with:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
});

type TransactionCategory = 'one_time' | 'subscription' | 'payment_plan';

interface CategorizedTransaction {
    category: TransactionCategory;
    charge: Stripe.Charge;
    subscription?: Stripe.Subscription;
    paymentIntent?: Stripe.PaymentIntent;
    invoice?: Stripe.Invoice;
    details: {
        productName: string;
        amount: number;
        currency: string;
        customerEmail: string;
        date: Date;
        status: string;
        metadata: Record<string, any>;
        paymentPlanInfo?: {
            totalPayments?: number;
            installmentsPaid?: number;
            remainingAmount?: number;
        };
        subscriptionInfo?: {
            planName?: string;
            interval?: string;
            currentPeriodEnd?: Date;
            cancelAtPeriodEnd?: boolean;
        };
    };
}

async function migrateTransactions() {
    console.log('Starting Stripe data migration...\n');

    try {
        // Get recent charges with expanded data
        const charges = await stripe.charges.list({
            limit: 100,
            expand: ['data.customer', 'data.payment_intent', 'data.invoice']
        });

        console.log(`Found ${charges.data.length} transactions to migrate\n`);

        // Process and categorize each charge
        const categorizedTransactions: CategorizedTransaction[] = [];

        for (const charge of charges.data) {
            const invoice = charge.invoice as Stripe.Invoice;
            let subscription: Stripe.Subscription | undefined;
            
            // If there's an invoice with a subscription, fetch the subscription details
            if (invoice?.subscription) {
                subscription = await stripe.subscriptions.retrieve(invoice.subscription as string, {
                    expand: ['items.data.price.product']
                });
            }

            // Determine the category and create the transaction object
            const transaction = await categorizeTransaction(charge, subscription);
            categorizedTransactions.push(transaction);
        }

        // Group transactions by customer email
        const customerTransactions = new Map<string, CategorizedTransaction[]>();
        
        categorizedTransactions.forEach(transaction => {
            const email = transaction.details.customerEmail;
            if (!customerTransactions.has(email)) {
                customerTransactions.set(email, []);
            }
            customerTransactions.get(email)!.push(transaction);
        });

        // Migrate each customer's data
        for (const [email, transactions] of customerTransactions) {
            if (email === 'No email') continue;

            console.log(`\nMigrating data for customer: ${email}`);
            
            // Create stripe customer mapping
            const stripeCustomerId = (transactions[0].charge.customer as Stripe.Customer).id;
            
            console.log('Checking for existing mapping...');
            const { data: existingMapping, error: mappingError } = await supabase
                .from('stripe_customer_mapping')
                .select('*')
                .eq('stripe_email', email)
                .single();

            console.log('Existing mapping:', existingMapping, 'Error:', mappingError);

            if (!existingMapping) {
                console.log('Creating new mapping...');
                const { error: insertError } = await supabase
                    .from('stripe_customer_mapping')
                    .insert({
                        stripe_customer_id: stripeCustomerId,
                        stripe_email: email,
                        is_migrated: false
                    });

                if (insertError) {
                    console.error(`Error creating stripe mapping for ${email}:`, insertError);
                    continue;
                }
                console.log('Mapping created successfully');
            }

            // Process each transaction
            for (const transaction of transactions) {
                try {
                    const stripeData = {
                        customer_id: (transaction.charge.customer as Stripe.Customer).id,
                        default_payment_method: {
                            id: transaction.charge.payment_method,
                            card: transaction.charge.payment_method_details?.card || null
                        },
                        subscriptions: [{
                            id: transaction.subscription?.id || transaction.charge.id,
                            status: transaction.details.status,
                            plan: {
                                nickname: transaction.details.productName,
                                amount: transaction.details.amount * 100,
                                currency: transaction.details.currency,
                                interval: transaction.details.subscriptionInfo?.interval || 'month'
                            },
                            current_period_start: transaction.details.date.toISOString(),
                            current_period_end: transaction.details.subscriptionInfo?.currentPeriodEnd?.toISOString() || 
                                new Date(transaction.details.date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            billing_cycle_anchor: transaction.details.date.toISOString(),
                            start_date: transaction.details.date.toISOString(),
                            items: {
                                total_count: transaction.details.paymentPlanInfo?.installmentsPaid || 1
                            },
                            latest_invoice: {
                                payment_intent: transaction.paymentIntent?.id
                            },
                            metadata: {
                                ...transaction.details.metadata,
                                is_payment_plan: transaction.category === 'payment_plan' ? 'true' : 'false',
                                total_payments: transaction.details.paymentPlanInfo?.totalPayments?.toString()
                            }
                        }]
                    };

                    console.log('Calling migrate_stripe_data_for_user with data:', JSON.stringify(stripeData, null, 2));
                    
                    // Call the migration function
                    const { data: migrationResult, error: migrationError } = await supabase
                        .rpc('migrate_stripe_data_for_user', {
                            stripe_data: stripeData,
                            user_uuid: null // This will be linked later when the user signs up
                        });

                    if (migrationError) {
                        console.error(`Error migrating transaction for ${email}:`, migrationError);
                    } else {
                        console.log(`Successfully migrated ${transaction.category} transaction:`, {
                            amount: transaction.details.amount,
                            product: transaction.details.productName,
                            date: transaction.details.date
                        });
                        console.log('Migration result:', migrationResult);
                    }
                } catch (error) {
                    console.error(`Error processing transaction for ${email}:`, error);
                }
            }
        }

    } catch (error) {
        console.error('Error in migration:', error);
    }
}

async function categorizeTransaction(
    charge: Stripe.Charge,
    subscription?: Stripe.Subscription
): Promise<CategorizedTransaction> {
    const customer = charge.customer as Stripe.Customer;
    const invoice = charge.invoice as Stripe.Invoice;
    const paymentIntent = charge.payment_intent as Stripe.PaymentIntent;

    // Base transaction details
    const transaction: CategorizedTransaction = {
        category: 'one_time',
        charge,
        subscription,
        paymentIntent,
        invoice,
        details: {
            productName: charge.description || 'Unnamed product',
            amount: charge.amount / 100,
            currency: charge.currency.toUpperCase(),
            customerEmail: customer?.email || 'No email',
            date: new Date(charge.created * 1000),
            status: charge.status,
            metadata: charge.metadata
        }
    };

    // Check for subscription indicators in description
    const isSubscriptionDesc = charge.description?.toLowerCase().includes('subscription') || false;
    
    // Check for payment plan indicators
    const isPaymentPlan = 
        charge.metadata?.is_payment_plan === 'true' ||
        charge.metadata?.total_payments ||
        charge.metadata?.number_of_installments ||
        // Check for specific product names that are known payment plans
        charge.description?.includes('DreamState Selling 1.0') ||
        charge.description?.includes('Unstoppable Confidence Mega-Bundle');

    if (isPaymentPlan) {
        transaction.category = 'payment_plan';
        const totalPayments = parseInt(charge.metadata?.total_payments || '6'); // Default to 6 payments for known products
        transaction.details.paymentPlanInfo = {
            totalPayments,
            installmentsPaid: parseInt(charge.metadata?.installments_paid || '1'),
            remainingAmount: (charge.amount / 100) * (totalPayments - 1)
        };
    }
    // Check if it's a subscription
    else if (subscription || isSubscriptionDesc) {
        transaction.category = 'subscription';
        transaction.details.subscriptionInfo = {
            planName: subscription?.items.data[0]?.price?.nickname || 
                     charge.description?.replace('Subscription update', '').trim() || 
                     'Unnamed plan',
            interval: subscription?.items.data[0]?.price?.recurring?.interval || 'month',
            currentPeriodEnd: subscription ? new Date(subscription.current_period_end * 1000) : undefined,
            cancelAtPeriodEnd: subscription?.cancel_at_period_end || false
        };
    }

    return transaction;
}

// Run the migration
migrateTransactions()
    .then(() => console.log('\nMigration completed'))
    .catch(console.error); 