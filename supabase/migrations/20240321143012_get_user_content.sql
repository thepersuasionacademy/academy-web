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
    granted_at timestamptz,
    access_starts_at timestamptz,
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
                        'has_access', (
                            -- Check module access from stored settings
                            SELECT 
                                CASE
                                    -- If content isn't accessible yet, module isn't either
                                    WHEN ua.access_starts_at > now() THEN false
                                    -- If content has no access, module doesn't either
                                    WHEN (ua.access_settings->0->>'hasAccess')::boolean = false THEN false
                                    -- Check module specific settings
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        WHERE (module->>'id')::uuid = m.id
                                        AND (module->>'hasAccess')::boolean = false
                                    ) THEN false
                                    -- If module has a delay, check if it's passed
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        WHERE (module->>'id')::uuid = m.id
                                        AND module->'accessDelay' IS NOT NULL
                                        AND (
                                            now() < ua.access_starts_at + 
                                            make_interval(
                                                days := CASE 
                                                    WHEN (module->'accessDelay'->>'unit') = 'days' THEN 
                                                        (module->'accessDelay'->>'value')::int
                                                    WHEN (module->'accessDelay'->>'unit') = 'weeks' THEN 
                                                        (module->'accessDelay'->>'value')::int * 7
                                                    WHEN (module->'accessDelay'->>'unit') = 'months' THEN 
                                                        (module->'accessDelay'->>'value')::int * 30
                                                    ELSE 0
                                                END
                                            )
                                        )
                                    ) THEN false
                                    ELSE true
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.content_id = c.id
                        ),
                        'access_date', (
                            -- Calculate when module becomes accessible
                            SELECT 
                                CASE
                                    -- If content has a delay, that's the base time
                                    WHEN ua.access_starts_at > now() THEN ua.access_starts_at
                                    -- If module has a specific delay, add it to content's start time
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        WHERE (module->>'id')::uuid = m.id
                                        AND module->'accessDelay' IS NOT NULL
                                    ) THEN
                                        ua.access_starts_at + 
                                        (
                                            SELECT make_interval(
                                                days := CASE 
                                                    WHEN (module->'accessDelay'->>'unit') = 'days' THEN 
                                                        (module->'accessDelay'->>'value')::int
                                                    WHEN (module->'accessDelay'->>'unit') = 'weeks' THEN 
                                                        (module->'accessDelay'->>'value')::int * 7
                                                    WHEN (module->'accessDelay'->>'unit') = 'months' THEN 
                                                        (module->'accessDelay'->>'value')::int * 30
                                                    ELSE 0
                                                END
                                            )
                                            FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                            WHERE (module->>'id')::uuid = m.id
                                            LIMIT 1
                                        )
                                    ELSE ua.access_starts_at
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.content_id = c.id
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
                            -- Check media access from stored settings
                            SELECT 
                                CASE
                                    -- If content isn't accessible yet, media isn't either
                                    WHEN ua.access_starts_at > now() THEN false
                                    -- If content has no access, media doesn't either
                                    WHEN (ua.access_settings->0->>'hasAccess')::boolean = false THEN false
                                    -- Check if parent module has access
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        WHERE (module->>'id')::uuid = med.module_id
                                        AND (module->>'hasAccess')::boolean = false
                                    ) THEN false
                                    -- Check media specific settings
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        CROSS JOIN jsonb_array_elements(module->'children') as media
                                        WHERE (module->>'id')::uuid = med.module_id
                                        AND (media->>'id')::uuid = med.id
                                        AND (media->>'hasAccess')::boolean = false
                                    ) THEN false
                                    -- Check if parent module has a delay
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        WHERE (module->>'id')::uuid = med.module_id
                                        AND module->'accessDelay' IS NOT NULL
                                        AND (
                                            now() < ua.access_starts_at + 
                                            make_interval(
                                                days := CASE 
                                                    WHEN (module->'accessDelay'->>'unit') = 'days' THEN 
                                                        (module->'accessDelay'->>'value')::int
                                                    WHEN (module->'accessDelay'->>'unit') = 'weeks' THEN 
                                                        (module->'accessDelay'->>'value')::int * 7
                                                    WHEN (module->'accessDelay'->>'unit') = 'months' THEN 
                                                        (module->'accessDelay'->>'value')::int * 30
                                                    ELSE 0
                                                END
                                            )
                                        )
                                    ) THEN false
                                    -- Check if media has its own delay
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        CROSS JOIN jsonb_array_elements(module->'children') as media
                                        WHERE (module->>'id')::uuid = med.module_id
                                        AND (media->>'id')::uuid = med.id
                                        AND media->'accessDelay' IS NOT NULL
                                        AND (
                                            now() < ua.access_starts_at + 
                                            make_interval(
                                                days := CASE 
                                                    WHEN (media->'accessDelay'->>'unit') = 'days' THEN 
                                                        (media->'accessDelay'->>'value')::int
                                                    WHEN (media->'accessDelay'->>'unit') = 'weeks' THEN 
                                                        (media->'accessDelay'->>'value')::int * 7
                                                    WHEN (media->'accessDelay'->>'unit') = 'months' THEN 
                                                        (media->'accessDelay'->>'value')::int * 30
                                                    ELSE 0
                                                END
                                            )
                                        )
                                    ) THEN false
                                    ELSE true
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.content_id = c.id
                        ),
                        'access_date', (
                            -- Calculate when media becomes accessible
                            SELECT 
                                CASE
                                    -- If content has a delay, that's the base time
                                    WHEN ua.access_starts_at > now() THEN ua.access_starts_at
                                    -- If parent module has a delay, add it
                                    WHEN EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                        WHERE (module->>'id')::uuid = med.module_id
                                        AND module->'accessDelay' IS NOT NULL
                                    ) THEN
                                        ua.access_starts_at + 
                                        (
                                            SELECT make_interval(
                                                days := CASE 
                                                    WHEN (module->'accessDelay'->>'unit') = 'days' THEN 
                                                        (module->'accessDelay'->>'value')::int
                                                    WHEN (module->'accessDelay'->>'unit') = 'weeks' THEN 
                                                        (module->'accessDelay'->>'value')::int * 7
                                                    WHEN (module->'accessDelay'->>'unit') = 'months' THEN 
                                                        (module->'accessDelay'->>'value')::int * 30
                                                    ELSE 0
                                                END
                                            )
                                            FROM jsonb_array_elements(ua.access_settings->0->'children') as module
                                            WHERE (module->>'id')::uuid = med.module_id
                                            LIMIT 1
                                        )
                                    ELSE ua.access_starts_at
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.content_id = c.id
                        ),
                        'media_type', (
                            select 
                                case 
                                    when exists (select 1 from content.videos v where v.media_id = med.id) then 'video'
                                    when exists (select 1 from content.text_content t where t.media_id = med.id) then 'text'
                                    when exists (select 1 from content.ai_content a where a.media_id = med.id) then 'tool'
                                    when exists (select 1 from content.pdf_content p where p.media_id = med.id) then 'pdf'
                                    when exists (select 1 from content.quiz_content q where q.media_id = med.id) then 'quiz'
                                    else null
                                end
                        )
                    ) order by med.order
                )
                from content.media med
                where med.module_id in (select m.id from content.modules m where m.content_id = c.id)
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
        ua.granted_at,
        ua.access_starts_at,
        ct.modules,
        ct.media
    from access.user_access ua
    left join content_titles ct on ua.content_id = ct.id
    where ua.user_id = p_user_id
    and ua.access_starts_at <= now()
    and (ua.access_settings->0->>'hasAccess')::boolean = true
    order by ua.granted_at desc;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_user_content(uuid) to authenticated; 