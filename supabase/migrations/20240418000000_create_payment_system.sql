-- migration: 20240418000000_create_payment_system.sql

-- Disable RLS for the migration and start transaction
BEGIN;
SET LOCAL statement_timeout = '10s';

-- First handle the down migration in case we need to rollback
DO $$ BEGIN
    -- Drop helper functions first
    DROP FUNCTION IF EXISTS get_user_payment_history(UUID);
    DROP FUNCTION IF EXISTS get_user_active_subscriptions(UUID);
    DROP FUNCTION IF EXISTS get_user_payment_plans_summary(UUID);

    -- Drop tables in correct order
    DROP TABLE IF EXISTS public.payment_methods CASCADE;
    DROP TABLE IF EXISTS public.refunds CASCADE;
    DROP TABLE IF EXISTS public.payment_plans CASCADE;
    DROP TABLE IF EXISTS public.subscriptions CASCADE;
    DROP TABLE IF EXISTS public.payments CASCADE;

    -- Drop types
    DROP TYPE IF EXISTS payment_method_type CASCADE;
    DROP TYPE IF EXISTS payment_method_status CASCADE;
    DROP TYPE IF EXISTS payment_frequency CASCADE;
    DROP TYPE IF EXISTS payment_plan_status CASCADE;
    DROP TYPE IF EXISTS subscription_status CASCADE;
    DROP TYPE IF EXISTS merchant_source CASCADE;
    DROP TYPE IF EXISTS payment_status CASCADE;
    DROP TYPE IF EXISTS payment_type CASCADE;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better data consistency
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('succeeded', 'failed', 'pending', 'refunded');
    CREATE TYPE payment_type AS ENUM ('subscription', 'one_time', 'payment_plan');
    CREATE TYPE merchant_source AS ENUM ('stripe', 'paypal', 'easypaydirect', 'authorize_net');
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'paused');
    CREATE TYPE payment_plan_status AS ENUM ('active', 'completed', 'overdue', 'defaulted');
    CREATE TYPE payment_method_type AS ENUM ('credit_card', 'bank_account', 'paypal_account');
    CREATE TYPE payment_method_status AS ENUM ('active', 'expired', 'removed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Payment Methods table (stores only tokenized/safe data)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    merchant_source merchant_source NOT NULL,
    payment_method_type payment_method_type NOT NULL,
    status payment_method_status NOT NULL DEFAULT 'active',
    display_name TEXT,
    last_four VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    merchant_payment_method_id VARCHAR(100) NOT NULL,
    merchant_customer_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_last_four CHECK (last_four ~ '^[0-9]{4}$'),
    CONSTRAINT valid_expiry_month CHECK (expiry_month BETWEEN 1 AND 12),
    CONSTRAINT valid_expiry_year CHECK (expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE))
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_type payment_type NOT NULL,
    merchant_source merchant_source NOT NULL,
    merchant_payment_id VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    reason TEXT,
    merchant_refund_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id),
    payment_id UUID REFERENCES public.payments(id),
    plan_name VARCHAR(100) NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    first_payment_date TIMESTAMPTZ NOT NULL,
    current_payment_date TIMESTAMPTZ NOT NULL,
    next_payment_date TIMESTAMPTZ NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    billing_cycle_anchor TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    merchant_subscription_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id),
    total_amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    installment_amount DECIMAL(10,2) NOT NULL,
    frequency TEXT NOT NULL,
    number_of_installments INTEGER NOT NULL,
    installments_paid INTEGER NOT NULL DEFAULT 0,
    installments_remaining INTEGER GENERATED ALWAYS AS (number_of_installments - installments_paid) STORED,
    status payment_plan_status NOT NULL DEFAULT 'active',
    first_payment_date TIMESTAMPTZ NOT NULL,
    current_payment_date TIMESTAMPTZ,
    next_payment_date TIMESTAMPTZ NOT NULL,
    last_payment_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ NOT NULL,
    expected_completion_date TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_status ON public.payment_methods(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_merchant_id ON public.payment_methods(merchant_payment_method_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_payment_id ON public.payments(merchant_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_subscription_id ON public.subscriptions(merchant_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment_date ON public.subscriptions(next_payment_date);

CREATE INDEX IF NOT EXISTS idx_payment_plans_user_id ON public.payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON public.payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_next_payment_date ON public.payment_plans(next_payment_date);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refunds_updated_at ON public.refunds;
CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_plans_updated_at ON public.payment_plans;
CREATE TRIGGER update_payment_plans_updated_at
    BEFORE UPDATE ON public.payment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Payment methods policies
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view own payment methods"
    ON public.payment_methods
    FOR SELECT
    USING (auth.uid() = user_id);

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
    ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Refunds policies
DROP POLICY IF EXISTS "Users can view own refunds" ON public.refunds;
CREATE POLICY "Users can view own refunds"
    ON public.refunds
    FOR SELECT
    USING (auth.uid() = (SELECT user_id FROM public.payments WHERE id = payment_id));

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Payment plans policies
DROP POLICY IF EXISTS "Users can view own payment plans" ON public.payment_plans;
CREATE POLICY "Users can view own payment plans"
    ON public.payment_plans
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_user_payment_history(user_uuid UUID)
RETURNS TABLE (
    payment_id UUID,
    amount DECIMAL,
    payment_date TIMESTAMPTZ,
    payment_type payment_type,
    status payment_status,
    merchant merchant_source,
    payment_method_display TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.amount,
        p.created_at,
        p.payment_type,
        p.status,
        p.merchant_source,
        pm.display_name
    FROM public.payments p
    LEFT JOIN public.payment_methods pm ON p.payment_method_id = pm.id
    WHERE p.user_id = user_uuid
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active subscriptions for user
CREATE OR REPLACE FUNCTION get_user_active_subscriptions(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name VARCHAR,
    amount DECIMAL,
    first_payment_date TIMESTAMPTZ,
    current_payment_date TIMESTAMPTZ,
    next_payment_date TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    status subscription_status,
    payment_method_display TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan_name,
        s.amount,
        s.first_payment_date,
        s.current_payment_date,
        s.next_payment_date,
        s.current_period_start,
        s.current_period_end,
        s.status,
        pm.display_name
    FROM public.subscriptions s
    LEFT JOIN public.payment_methods pm ON s.payment_method_id = pm.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get payment plans summary
CREATE OR REPLACE FUNCTION get_user_payment_plans_summary(user_uuid UUID)
RETURNS TABLE (
    plan_id UUID,
    total_amount DECIMAL,
    remaining_amount DECIMAL,
    installment_amount DECIMAL,
    number_of_installments INTEGER,
    installments_paid INTEGER,
    installments_remaining INTEGER,
    first_payment_date TIMESTAMPTZ,
    current_payment_date TIMESTAMPTZ,
    next_payment_date TIMESTAMPTZ,
    expected_completion_date TIMESTAMPTZ,
    status payment_plan_status,
    payment_method_display TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.total_amount,
        pp.remaining_amount,
        pp.installment_amount,
        pp.number_of_installments,
        pp.installments_paid,
        pp.installments_remaining,
        pp.first_payment_date,
        pp.current_payment_date,
        pp.next_payment_date,
        pp.expected_completion_date,
        pp.status,
        pm.display_name
    FROM public.payment_plans pp
    LEFT JOIN public.payment_methods pm ON pp.payment_method_id = pm.id
    WHERE pp.user_id = user_uuid
    ORDER BY pp.next_payment_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anon users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

COMMIT; 