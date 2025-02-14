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
    collection_name text,
    status access.access_status,
    granted_by uuid,
    granted_at timestamptz,
    access_starts_at timestamptz,
    access_ends_at timestamptz,
    modules jsonb,
    media jsonb
) language sql security definer as $$
    with content_titles as (
        -- Regular content with collection info
        select 
            c.id,
            c.title,
            'content' as type,
            col.name as collection_name,
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'title', m.title,
                        'order', m.order,
                        'has_access', exists (
                            select 1 
                            from access.user_access ua2 
                            where ua2.user_id = p_user_id 
                            and ua2.content_id = m.id 
                            and ua2.status = 'active'
                            and (ua2.access_ends_at is null or ua2.access_ends_at > now())
                        ),
                        'access_date', (
                            select access_starts_at
                            from access.user_access ua2 
                            where ua2.user_id = p_user_id 
                            and ua2.content_id = m.id 
                            and ua2.status = 'active'
                            limit 1
                        )
                    ) order by m.order
                )
                from content.modules m
                where m.content_id = c.id
            ) as modules,
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'id', med.id,
                        'title', med.title,
                        'order', med.order,
                        'module_id', med.module_id,
                        'has_access', (
                            -- Direct access to media
                            exists (
                                select 1 
                                from access.user_access ua2 
                                where ua2.user_id = p_user_id 
                                and ua2.content_id = med.id 
                                and ua2.status = 'active'
                                and (ua2.access_ends_at is null or ua2.access_ends_at > now())
                            )
                            -- OR inherited access from parent module
                            OR exists (
                                select 1 
                                from access.user_access ua2 
                                where ua2.user_id = p_user_id 
                                and ua2.content_id = med.module_id 
                                and ua2.status = 'active'
                                and (ua2.access_ends_at is null or ua2.access_ends_at > now())
                            )
                        ),
                        'access_date', (
                            select min(access_date)
                            from (
                                -- Direct media access date
                                select access_starts_at as access_date
                                from access.user_access ua2 
                                where ua2.user_id = p_user_id 
                                and ua2.content_id = med.id 
                                and ua2.status = 'active'
                                union all
                                -- Parent module access date
                                select access_starts_at as access_date
                                from access.user_access ua2 
                                where ua2.user_id = p_user_id 
                                and ua2.content_id = med.module_id 
                                and ua2.status = 'active'
                            ) dates
                            where access_date is not null
                            limit 1
                        )
                    ) order by med.order
                )
                from content.media med
                where med.content_id = c.id
            ) as media
        from content.content c
        left join content.collections col on c.collection_id = col.id
    )
    select 
        ua.id,
        ua.content_id,
        ct.title as content_title,
        ct.type as content_type,
        ct.collection_name,
        ua.status,
        ua.granted_by,
        ua.granted_at,
        ua.access_starts_at,
        ua.access_ends_at,
        ct.modules,
        ct.media
    from access.user_access ua
    left join content_titles ct on ua.content_id = ct.id
    where ua.user_id = p_user_id
    and ua.status = 'active'
    and ct.type = 'content'
    and (ua.access_ends_at is null or ua.access_ends_at > now())
    order by ua.granted_at desc;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_content(uuid) to authenticated; 