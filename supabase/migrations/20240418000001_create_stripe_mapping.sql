-- migration: 20240418000001_create_stripe_mapping.sql
BEGIN;

-- Create the stripe customer mapping table
CREATE TABLE IF NOT EXISTS public.stripe_customer_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_customer_id TEXT UNIQUE NOT NULL,
    stripe_email TEXT NOT NULL,
    payment_data JSONB,
    is_migrated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_customer_mapping_email ON public.stripe_customer_mapping(stripe_email);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_mapping_stripe_id ON public.stripe_customer_mapping(stripe_customer_id);

-- Create function to link stripe customer to user when they sign up
CREATE OR REPLACE FUNCTION link_stripe_customer_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's a matching stripe customer
    UPDATE public.payment_methods
    SET user_id = NEW.id
    WHERE user_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM public.stripe_customer_mapping
        WHERE stripe_email = NEW.email
        AND payment_methods.metadata->>'stripe_customer_id' = stripe_customer_id
    );

    -- Update other payment tables similarly
    UPDATE public.payments
    SET user_id = NEW.id
    WHERE user_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM public.stripe_customer_mapping
        WHERE stripe_email = NEW.email
        AND payments.metadata->>'stripe_customer_id' = stripe_customer_id
    );

    UPDATE public.subscriptions
    SET user_id = NEW.id
    WHERE user_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM public.stripe_customer_mapping
        WHERE stripe_email = NEW.email
        AND subscriptions.metadata->>'stripe_customer_id' = stripe_customer_id
    );

    UPDATE public.payment_plans
    SET user_id = NEW.id
    WHERE user_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM public.stripe_customer_mapping
        WHERE stripe_email = NEW.email
        AND payment_plans.metadata->>'stripe_customer_id' = stripe_customer_id
    );

    -- Update the mapping table to mark as migrated
    UPDATE public.stripe_customer_mapping
    SET 
        is_migrated = TRUE,
        updated_at = NOW()
    WHERE stripe_email = NEW.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically link stripe customer when user signs up
DROP TRIGGER IF EXISTS trigger_link_stripe_customer ON auth.users;
CREATE TRIGGER trigger_link_stripe_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION link_stripe_customer_on_signup();

COMMIT; 