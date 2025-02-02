-- Create function to get total credits
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

-- Grant access to the function
grant execute on function public.get_total_credits(uuid) to authenticated; 