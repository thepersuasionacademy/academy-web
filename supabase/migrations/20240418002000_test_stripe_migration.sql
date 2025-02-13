-- Test migration for Stripe data
BEGIN;

-- Create a test user if needed (comment out if you want to use an existing user)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    INSERT INTO auth.users (id, email)
    VALUES ('11111111-1111-1111-1111-111111111111', 'test@example.com')
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO test_user_id;
END $$;

-- Test Case 1: Regular Subscription
SELECT migrate_stripe_data_for_user(
    '11111111-1111-1111-1111-111111111111'::UUID,
    '{
        "customer_id": "cus_test123",
        "default_payment_method": {
            "id": "pm_test123",
            "card": {
                "last4": "4242",
                "exp_month": 12,
                "exp_year": 2025
            }
        },
        "subscriptions": [
            {
                "id": "sub_regular123",
                "status": "active",
                "plan": {
                    "nickname": "Premium Monthly",
                    "amount": 2999,
                    "currency": "USD",
                    "interval": "month"
                },
                "current_period_start": "2024-04-01T00:00:00Z",
                "current_period_end": "2024-05-01T00:00:00Z",
                "billing_cycle_anchor": "2024-04-01T00:00:00Z",
                "start_date": "2024-04-01T00:00:00Z",
                "cancel_at_period_end": false,
                "latest_invoice": {
                    "payment_intent": "pi_test123"
                },
                "metadata": {}
            }
        ]
    }'::jsonb
);

-- Test Case 2: Payment Plan
SELECT migrate_stripe_data_for_user(
    '11111111-1111-1111-1111-111111111111'::UUID,
    '{
        "customer_id": "cus_test456",
        "default_payment_method": {
            "id": "pm_test456",
            "card": {
                "last4": "4242",
                "exp_month": 12,
                "exp_year": 2025
            }
        },
        "subscriptions": [
            {
                "id": "sub_plan123",
                "status": "active",
                "plan": {
                    "nickname": "Course Payment Plan",
                    "amount": 9900,
                    "currency": "USD",
                    "interval": "month"
                },
                "current_period_start": "2024-04-01T00:00:00Z",
                "current_period_end": "2024-05-01T00:00:00Z",
                "billing_cycle_anchor": "2024-04-01T00:00:00Z",
                "start_date": "2024-04-01T00:00:00Z",
                "items": {
                    "total_count": 2
                },
                "latest_invoice": {
                    "payment_intent": "pi_test456"
                },
                "metadata": {
                    "is_payment_plan": "true",
                    "total_payments": "6"
                }
            }
        ]
    }'::jsonb
);

-- Verify Results
SELECT 'Regular Subscriptions' as test, COUNT(*) as count 
FROM public.subscriptions 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Payment Plans' as test, COUNT(*) as count 
FROM public.payment_plans 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Payments' as test, COUNT(*) as count 
FROM public.payments 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Detailed Results
SELECT 'Subscription Details' as type, s.* 
FROM public.subscriptions s 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Payment Plan Details' as type, pp.* 
FROM public.payment_plans pp 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Cleanup (comment out if you want to keep the test data)
/*
DO $$
BEGIN
    DELETE FROM public.payments WHERE user_id = '11111111-1111-1111-1111-111111111111';
    DELETE FROM public.subscriptions WHERE user_id = '11111111-1111-1111-1111-111111111111';
    DELETE FROM public.payment_plans WHERE user_id = '11111111-1111-1111-111111111111';
    DELETE FROM public.payment_methods WHERE user_id = '11111111-1111-1111-1111-111111111111';
    DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';
END $$;
*/

ROLLBACK; -- Change to COMMIT if you want to keep the test data 