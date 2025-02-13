-- Migration to remove user_id constraints
BEGIN;

-- Drop foreign key constraints
ALTER TABLE public.payment_methods
    DROP CONSTRAINT IF EXISTS payment_methods_user_id_fkey,
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_user_id_fkey,
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey,
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.payment_plans
    DROP CONSTRAINT IF EXISTS payment_plans_user_id_fkey,
    ALTER COLUMN user_id DROP NOT NULL;

COMMIT; 