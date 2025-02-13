-- Create the payments table
create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    amount numeric(10,2) not null,
    status text not null,
    payment_type text not null,
    description text,
    receipt_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Set up RLS policies
alter table public.payments enable row level security;

-- Allow users to read their own payment data
create policy "Users can view own payments"
    on public.payments for select
    using (auth.uid() = user_id);

-- Create an index on user_id and created_at for faster queries
create index payments_user_id_created_at_idx on public.payments(user_id, created_at desc);

-- Function to get user's payment history
create or replace function public.get_user_payments(p_user_id uuid, p_limit int default 100)
returns setof public.payments
language sql
security definer
as $$
    select *
    from public.payments
    where user_id = p_user_id
    order by created_at desc
    limit p_limit;
$$; 