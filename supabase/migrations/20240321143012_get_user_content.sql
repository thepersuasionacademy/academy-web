-- Drop existing functions first
drop function if exists get_user_content(uuid);
drop function if exists public.get_user_content_access(uuid);
drop function if exists public.get_user_access(uuid);

-- Create the function in public schema
create or replace function public.get_user_content(p_user_id uuid)
returns table (
    id uuid,
    content_id uuid,
    content_title text,
    content_type text,
    status access.access_status,
    granted_by uuid,
    granted_at timestamptz,
    access_starts_at timestamptz,
    access_ends_at timestamptz
) language sql security definer as $$
    with content_titles as (
        -- Regular content
        select c.id, c.title, 'content' as type 
        from content.content c
        union all
        -- Media content
        select m.id, m.title, 'media' as type 
        from content.media m
        union all
        -- Modules
        select m.id, m.title, 'module' as type 
        from content.modules m
        union all
        -- Collections
        select c.id, c.name as title, 'collection' as type 
        from content.collections c
    )
    select 
        ua.id,
        ua.content_id,
        ct.title as content_title,
        ct.type as content_type,
        ua.status,
        ua.granted_by,
        ua.granted_at,
        ua.access_starts_at,
        ua.access_ends_at
    from access.user_access ua
    left join content_titles ct on ua.content_id = ct.id
    where ua.user_id = p_user_id
    and ua.status = 'active'
    and (ua.access_ends_at is null or ua.access_ends_at > now())
    order by ua.granted_at desc;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_content(uuid) to authenticated; 