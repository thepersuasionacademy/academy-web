-- Drop existing function first
drop function if exists public.deduct_user_credits(uuid, integer);

-- Create function to deduct credits from user balance
create or replace function public.deduct_user_credits(
  p_user_id uuid,
  p_credits_cost integer
)
returns json
language plpgsql
security definer
set search_path = public, credits
as $$
declare
  v_subscription_credits integer;
  v_additional_credits integer;
  v_subscription_deduction integer;
  v_additional_deduction integer;
  result json;
begin
  -- Get current credit balances
  select subscription_credits, additional_credits 
  into v_subscription_credits, v_additional_credits
  from user_balances 
  where user_id = p_user_id;

  -- Calculate how much to deduct from each type
  if v_subscription_credits >= p_credits_cost then
    -- If we have enough subscription credits, take it all from there
    v_subscription_deduction := p_credits_cost;
    v_additional_deduction := 0;
  else
    -- Take what we can from subscription credits
    v_subscription_deduction := v_subscription_credits;
    -- Take the rest from additional credits
    v_additional_deduction := p_credits_cost - v_subscription_credits;
  end if;

  -- Update the balances
  update user_balances
  set 
    subscription_credits = subscription_credits - v_subscription_deduction,
    additional_credits = additional_credits - v_additional_deduction,
    last_updated = now()
  where user_id = p_user_id
  returning to_json(user_balances.*) into result;

  return result;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.deduct_user_credits(uuid, integer) to authenticated; 