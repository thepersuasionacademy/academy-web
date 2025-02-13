-- Create the stripe_customers table
create table if not exists public.stripe_customers (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    stripe_customer_id text not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    constraint stripe_customers_user_id_key unique (user_id),
    constraint stripe_customers_stripe_customer_id_key unique (stripe_customer_id)
);

-- Set up RLS policies
alter table public.stripe_customers enable row level security;

-- Allow users to read their own customer data
create policy "Users can view own stripe customer data"
    on public.stripe_customers for select
    using (auth.uid() = user_id);

-- Create function to get stripe customer id
create or replace function public.get_stripe_customer_id(p_user_id uuid)
returns text
language plpgsql security definer
as $$
begin
    return (
        select stripe_customer_id
        from public.stripe_customers
        where user_id = p_user_id
    );
end;
$$; 