-- Create credits schema if it doesn't exist
create schema if not exists credits;

-- Create the user_balances table
create table if not exists credits.user_balances (
  user_id uuid references auth.users(id) primary key,
  subscription_credits int4 default 0,
  additional_credits int4 default 0,
  last_updated timestamptz default now(),
  constraint positive_subscription_credits check (subscription_credits >= 0),
  constraint positive_additional_credits check (additional_credits >= 0)
);

-- Enable RLS
alter table credits.user_balances enable row level security;

-- Create policies
create policy "Users can view their own balance"
  on credits.user_balances for select
  using (auth.uid() = user_id);

create policy "System can update balances"
  on credits.user_balances for all
  using (true)
  with check (true);

-- Create function to get total credits (in public schema for easy access)
create or replace function public.get_total_credits(user_id uuid)
returns int4
language sql
security definer
set search_path = credits, public
stable
as $$
  select coalesce(subscription_credits, 0) + coalesce(additional_credits, 0)
  from credits.user_balances
  where user_id = $1;
$$;

-- Grant necessary permissions
grant usage on schema credits to authenticated;
grant select on credits.user_balances to authenticated;
grant execute on function public.get_total_credits(uuid) to authenticated; 