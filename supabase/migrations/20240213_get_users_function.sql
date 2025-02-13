-- Drop existing function if it exists
drop function if exists get_all_users();

-- Create a function to get all users with their profile information
create or replace function get_all_users()
returns table (
  id uuid,
  email varchar,
  first_name text,
  last_name text,
  created_at timestamptz,
  updated_at timestamptz,
  profile_image_url text
)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select 
    up.id,
    up.email,
    up.first_name,
    up.last_name,
    up.updated_at as created_at, -- using updated_at since that's what we have
    up.updated_at,
    up.profile_image_url
  from public.user_profiles up
  order by up.updated_at desc;
end;
$$; 