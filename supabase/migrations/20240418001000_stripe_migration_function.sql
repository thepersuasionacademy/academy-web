-- Migration for Stripe data migration functions
-- Up Migration
BEGIN;

-- Drop existing functions first
DROP FUNCTION IF EXISTS migrate_stripe_data_for_user(UUID, JSONB);
DROP FUNCTION IF EXISTS process_stripe_subscription(JSONB, UUID, UUID);

-- Drop the type if it exists
DROP TYPE IF EXISTS stripe_migration_result CASCADE;

-- Create a type to store the migration result
CREATE TYPE stripe_migration_result AS (
    success BOOLEAN,
    message TEXT,
    details JSONB
);

-- Function to process Stripe subscription data
CREATE OR REPLACE FUNCTION process_stripe_subscription(
    subscription_data JSONB,
    payment_method_id UUID
) RETURNS stripe_migration_result AS $$
DECLARE
    result stripe_migration_result;
    subscription_id UUID;
    payment_id UUID;
    is_payment_plan BOOLEAN;
    total_payments INTEGER;
BEGIN
    -- Initialize result
    result.success := FALSE;
    result.details := '{}'::JSONB;

    -- Determine if this is a payment plan or subscription
    -- Payment plans have metadata with total_payments or number_of_installments
    is_payment_plan := (
        subscription_data->'metadata'->>'total_payments' IS NOT NULL OR
        subscription_data->'metadata'->>'number_of_installments' IS NOT NULL OR
        subscription_data->'metadata'->>'is_payment_plan' = 'true'
    );

    IF is_payment_plan THEN
        -- Handle as payment plan
        total_payments := COALESCE(
            (subscription_data->'metadata'->>'total_payments')::INTEGER,
            (subscription_data->'metadata'->>'number_of_installments')::INTEGER
        );

        INSERT INTO public.payment_plans (
            payment_method_id,
            total_amount,
            remaining_amount,
            installment_amount,
            frequency,
            number_of_installments,
            installments_paid,
            status,
            first_payment_date,
            next_payment_date,
            start_date,
            expected_completion_date,
            metadata
        ) VALUES (
            payment_method_id,
            (subscription_data->>'plan'->>'amount')::DECIMAL / 100,
            (subscription_data->>'plan'->>'amount')::DECIMAL / 100 * 
                (total_payments - COALESCE((subscription_data->>'items'->>'total_count')::INTEGER, 0)),
            (subscription_data->'plan'->>'amount')::DECIMAL / 100,
            CASE 
                WHEN subscription_data->'plan'->>'interval' = 'month' THEN 'monthly'
                WHEN subscription_data->'plan'->>'interval' = 'year' THEN 'yearly'
                ELSE subscription_data->'plan'->>'interval'
            END,
            total_payments,
            COALESCE((subscription_data->'items'->>'total_count')::INTEGER, 0),
            CASE 
                WHEN subscription_data->>'status' = 'active' THEN 'active'::payment_plan_status
                WHEN subscription_data->>'status' = 'canceled' THEN 'completed'::payment_plan_status
                WHEN subscription_data->>'status' = 'past_due' THEN 'overdue'::payment_plan_status
                ELSE 'active'::payment_plan_status
            END,
            (subscription_data->>'start_date')::TIMESTAMPTZ,
            (subscription_data->>'current_period_end')::TIMESTAMPTZ,
            (subscription_data->>'start_date')::TIMESTAMPTZ,
            (subscription_data->>'current_period_end')::TIMESTAMPTZ + 
                (interval '1' || subscription_data->'plan'->>'interval') * (total_payments - 1),
            subscription_data->'metadata'
        )
        RETURNING id INTO subscription_id;

        result.message := 'Successfully processed as payment plan';
    ELSE
        -- Handle as subscription
        INSERT INTO public.subscriptions (
            payment_method_id,
            plan_name,
            status,
            amount,
            currency,
            first_payment_date,
            current_payment_date,
            next_payment_date,
            current_period_start,
            current_period_end,
            billing_cycle_anchor,
            cancel_at_period_end,
            canceled_at,
            merchant_subscription_id,
            metadata
        ) VALUES (
            payment_method_id,
            subscription_data->'plan'->>'nickname',
            CASE 
                WHEN subscription_data->>'status' = 'active' THEN 'active'::subscription_status
                WHEN subscription_data->>'status' = 'canceled' THEN 'cancelled'::subscription_status
                WHEN subscription_data->>'status' = 'past_due' THEN 'past_due'::subscription_status
                ELSE 'active'::subscription_status
            END,
            (subscription_data->'plan'->>'amount')::DECIMAL / 100,
            COALESCE(subscription_data->'plan'->>'currency', 'USD'),
            (subscription_data->>'start_date')::TIMESTAMPTZ,
            (subscription_data->>'current_period_start')::TIMESTAMPTZ,
            (subscription_data->>'current_period_end')::TIMESTAMPTZ,
            (subscription_data->>'current_period_start')::TIMESTAMPTZ,
            (subscription_data->>'current_period_end')::TIMESTAMPTZ,
            (subscription_data->>'billing_cycle_anchor')::TIMESTAMPTZ,
            (subscription_data->>'cancel_at_period_end')::BOOLEAN,
            CASE 
                WHEN subscription_data->>'canceled_at' IS NOT NULL 
                THEN (subscription_data->>'canceled_at')::TIMESTAMPTZ 
                ELSE NULL 
            END,
            subscription_data->>'id',
            subscription_data->'metadata'
        )
        RETURNING id INTO subscription_id;

        result.message := 'Successfully processed as subscription';
    END IF;

    -- Record the initial payment
    INSERT INTO public.payments (
        payment_method_id,
        amount,
        currency,
        status,
        payment_type,
        merchant_source,
        merchant_payment_id,
        description,
        metadata
    ) VALUES (
        payment_method_id,
        (subscription_data->'plan'->>'amount')::DECIMAL / 100,
        COALESCE(subscription_data->'plan'->>'currency', 'USD'),
        'succeeded'::payment_status,
        CASE 
            WHEN is_payment_plan THEN 'payment_plan'::payment_type
            ELSE 'subscription'::payment_type
        END,
        'stripe'::merchant_source,
        subscription_data->'latest_invoice'->>'payment_intent',
        'Initial payment for ' || CASE 
            WHEN is_payment_plan THEN 'payment plan'
            ELSE 'subscription'
        END,
        jsonb_build_object(
            'subscription_id', subscription_id,
            'stripe_subscription_id', subscription_data->>'id'
        )
    )
    RETURNING id INTO payment_id;

    -- Update the subscription/payment plan with the payment ID
    IF is_payment_plan THEN
        UPDATE public.payment_plans 
        SET metadata = jsonb_set(
            metadata, 
            '{initial_payment_id}', 
            to_jsonb(payment_id::TEXT)
        )
        WHERE id = subscription_id;
    ELSE
        UPDATE public.subscriptions 
        SET payment_id = payment_id
        WHERE id = subscription_id;
    END IF;

    result.success := TRUE;
    result.details := jsonb_build_object(
        'subscription_id', subscription_id,
        'payment_id', payment_id,
        'is_payment_plan', is_payment_plan
    );

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    result.success := FALSE;
    result.message := 'Error processing subscription: ' || SQLERRM;
    result.details := jsonb_build_object(
        'error_detail', SQLSTATE,
        'subscription_data', subscription_data
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate all Stripe data for a user
CREATE OR REPLACE FUNCTION migrate_stripe_data_for_user(
    stripe_data JSONB
) RETURNS JSONB AS $$
DECLARE
    result JSONB := '{"success": false, "processed": 0, "failed": 0, "details": []}'::JSONB;
    subscription_result stripe_migration_result;
    payment_method_id UUID;
    subscription_record JSONB;
BEGIN
    -- First, ensure we have a payment method
    INSERT INTO public.payment_methods (
        merchant_source,
        payment_method_type,
        status,
        merchant_payment_method_id,
        merchant_customer_id,
        metadata
    ) VALUES (
        'stripe'::merchant_source,
        'credit_card'::payment_method_type,
        'active'::payment_method_status,
        stripe_data->'default_payment_method'->>'id',
        stripe_data->>'customer_id',
        stripe_data->'default_payment_method'
    )
    RETURNING id INTO payment_method_id;

    -- Process each subscription
    FOR subscription_record IN 
        SELECT value FROM jsonb_array_elements(stripe_data->'subscriptions')
    LOOP
        subscription_result := process_stripe_subscription(
            subscription_record,
            payment_method_id
        );

        IF subscription_result.success THEN
            result := jsonb_set(
                result,
                '{processed}',
                to_jsonb((result->>'processed')::INTEGER + 1)
            );
        ELSE
            result := jsonb_set(
                result,
                '{failed}',
                to_jsonb((result->>'failed')::INTEGER + 1)
            );
        END IF;

        result := jsonb_set(
            result,
            '{details}',
            (result->'details') || to_jsonb(subscription_result)
        );
    END LOOP;

    result := jsonb_set(result, '{success}', 'true'::jsonb);
    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT; 