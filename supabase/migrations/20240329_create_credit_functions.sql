-- Drop existing functions first
drop function if exists public.get_total_credits(uuid);
drop function if exists public.get_subscription_credits(uuid);
drop function if exists public.get_additional_credits(uuid);

-- Function to get all credit information
create or replace function public.get_total_credits(user_id uuid)
returns json
language sql
security definer
set search_path = credits, public
stable
as $$
  select json_build_object(
    'total', coalesce(subscription_credits, 0) + coalesce(additional_credits, 0),
    'subscription_credits', coalesce(subscription_credits, 0),
    'additional_credits', coalesce(additional_credits, 0)
  )
  from credits.user_balances
  where user_id = $1;
$$;

-- Grant access to the function
grant execute on function public.get_total_credits(uuid) to authenticated; 