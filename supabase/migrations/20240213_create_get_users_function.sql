-- Create a function to get all users with their profile information
create or replace function get_all_users()
returns table (
  id uuid,
  email varchar,
  created_at timestamptz,
  updated_at timestamptz,
  subscription_tier text
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select 
    au.id,
    au.email,
    au.created_at,
    au.updated_at,
    coalesce(up.subscription_tier, 'free'::text) as subscription_tier
  from auth.users au
  left join public.user_profiles up on up.user_id = au.id
  order by au.created_at desc;
end;
$$; 