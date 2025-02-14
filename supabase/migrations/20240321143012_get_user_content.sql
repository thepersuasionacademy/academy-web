-- Drop everything first
drop function if exists get_user_content(uuid);
drop function if exists public.get_user_content_access(uuid);
drop function if exists public.get_user_access(uuid);

-- Simple function to get user's access records
create function public.get_user_access(p_user_id uuid)
returns table (
    id uuid,
    content_id uuid,
    status access.access_status,
    granted_by uuid,
    granted_at timestamptz,
    access_starts_at timestamptz,
    access_ends_at timestamptz
) language sql security definer as $$
    select 
        id,
        content_id,
        status,
        granted_by,
        granted_at,
        access_starts_at,
        access_ends_at
    from access.user_access
    where user_id = p_user_id
    and status = 'active'
    and (access_ends_at is null or access_ends_at > now())
    order by granted_at desc;
$$; 