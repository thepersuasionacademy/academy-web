-- Update get_content_groups function to work with the new user_access table structure
DROP FUNCTION IF EXISTS public.get_content_groups(UUID);

CREATE OR REPLACE FUNCTION public.get_content_groups(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    content_id UUID,
    content_title TEXT,
    collection_id UUID,
    collection_name TEXT,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ,
    has_access BOOLEAN,
    access_overrides JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
AS $$
    SELECT DISTINCT
        c.id as content_id,
        c.title as content_title,
        col.id as collection_id,
        col.name as collection_name,
        ua.granted_at,
        ua.access_starts_at,
        -- Determine if content has access based on access_starts_at only
        ua.access_starts_at <= NOW() as has_access,
        -- Include access_overrides for UI to handle restrictions
        ua.access_overrides
    FROM access.user_access ua
    JOIN content.content c ON c.id = ua.target_id
    LEFT JOIN content.collections col ON col.id = c.collection_id
    WHERE ua.user_id = p_user_id
    AND ua.type = 'content'
    ORDER BY ua.granted_at DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_groups(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_content_groups(UUID) IS 'Returns content groups a user has access to, based on the new user_access table structure with target_id and type fields';

-- Update get_content_access_structure function to work with the new user_access table structure
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_content_access_structure(
    p_content_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, access
AS $$
DECLARE
    v_result JSONB;
    v_content JSONB;
    v_modules JSONB;
    v_media JSONB;
    v_user_access JSONB;
BEGIN
    -- Get content details
    SELECT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'collection_id', c.collection_id
    ) INTO v_content
    FROM content.content c
    WHERE c.id = p_content_id;
    
    -- Get modules for this content
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'title', m.title,
                    'order', m.order
                ) ORDER BY m.order
            ),
            '[]'::jsonb
        ) INTO v_modules
    FROM content.modules m
    WHERE m.content_id = p_content_id;
    
    -- Get media for this content
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'title', m.title,
                    'module_id', m.module_id,
                    'order', m.order
                ) ORDER BY mod.order, m.order
            ),
            '[]'::jsonb
        ) INTO v_media
    FROM content.media m
    JOIN content.modules mod ON m.module_id = mod.id
    WHERE mod.content_id = p_content_id;
    
    -- Get user access details
    SELECT jsonb_build_object(
        'user_id', ua.user_id,
        'target_id', ua.target_id,
        'granted_at', ua.granted_at,
        'access_starts_at', ua.access_starts_at,
        'access_overrides', ua.access_overrides
    ) INTO v_user_access
    FROM access.user_access ua
    WHERE ua.user_id = p_user_id
    AND ua.target_id = p_content_id
    AND ua.type = 'content';
    
    -- Build the final result
    v_result := jsonb_build_object(
        'content', v_content,
        'modules', v_modules,
        'media', v_media,
        'user_access', v_user_access
    );
    
    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_access_structure(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_content_access_structure(UUID, UUID) IS 'Returns the content structure with access details for a specific user, based on the new user_access table structure with target_id and type fields';

-- Update get_user_content_groups function to work with the new user_access table structure
DROP FUNCTION IF EXISTS public.get_user_content_groups(UUID);

CREATE OR REPLACE FUNCTION public.get_user_content_groups(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    content_id UUID,
    content_title TEXT,
    content_type TEXT,
    collection_name TEXT,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ,
    modules JSONB,
    media JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
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
                                    -- Check if module is locked in access_overrides
                                    WHEN (ua.access_overrides->>'modules')::jsonb ? m.id::text 
                                    AND (ua.access_overrides->'modules'->m.id::text->>'status') = 'locked' THEN false
                                    -- Check if module has a pending delay
                                    WHEN (ua.access_overrides->>'modules')::jsonb ? m.id::text 
                                    AND (ua.access_overrides->'modules'->m.id::text->>'status') = 'pending'
                                    AND (ua.access_overrides->'modules'->m.id::text->'delay') IS NOT NULL
                                    AND (
                                        now() < ua.access_starts_at + 
                                        make_interval(
                                            days := CASE 
                                                WHEN (ua.access_overrides->'modules'->m.id::text->'delay'->>'unit') = 'days' THEN 
                                                    (ua.access_overrides->'modules'->m.id::text->'delay'->>'value')::int
                                                WHEN (ua.access_overrides->'modules'->m.id::text->'delay'->>'unit') = 'weeks' THEN 
                                                    (ua.access_overrides->'modules'->m.id::text->'delay'->>'value')::int * 7
                                                WHEN (ua.access_overrides->'modules'->m.id::text->'delay'->>'unit') = 'months' THEN 
                                                    (ua.access_overrides->'modules'->m.id::text->'delay'->>'value')::int * 30
                                                ELSE 0
                                            END
                                        )
                                    ) THEN false
                                    ELSE true
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.target_id = c.id
                            AND ua.type = 'content'
                        ),
                        'access_date', (
                            -- Calculate when module becomes accessible
                            SELECT 
                                CASE
                                    -- If content has a delay, that's the base time
                                    WHEN ua.access_starts_at > now() THEN ua.access_starts_at
                                    -- If module has a pending delay, calculate release date
                                    WHEN (ua.access_overrides->>'modules')::jsonb ? m.id::text 
                                    AND (ua.access_overrides->'modules'->m.id::text->>'status') = 'pending'
                                    AND (ua.access_overrides->'modules'->m.id::text->'delay') IS NOT NULL
                                    THEN
                                        ua.access_starts_at + 
                                        make_interval(
                                            days := CASE 
                                                WHEN (ua.access_overrides->'modules'->m.id::text->'delay'->>'unit') = 'days' THEN 
                                                    (ua.access_overrides->'modules'->m.id::text->'delay'->>'value')::int
                                                WHEN (ua.access_overrides->'modules'->m.id::text->'delay'->>'unit') = 'weeks' THEN 
                                                    (ua.access_overrides->'modules'->m.id::text->'delay'->>'value')::int * 7
                                                WHEN (ua.access_overrides->'modules'->m.id::text->'delay'->>'unit') = 'months' THEN 
                                                    (ua.access_overrides->'modules'->m.id::text->'delay'->>'value')::int * 30
                                                ELSE 0
                                            END
                                        )
                                    ELSE ua.access_starts_at
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.target_id = c.id
                            AND ua.type = 'content'
                        )
                    ) ORDER BY m.order
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
                                    -- Check if media is locked in access_overrides
                                    WHEN (ua.access_overrides->>'media')::jsonb ? med.id::text 
                                    AND (ua.access_overrides->'media'->med.id::text->>'status') = 'locked' THEN false
                                    -- Check if parent module is locked
                                    WHEN (ua.access_overrides->>'modules')::jsonb ? med.module_id::text 
                                    AND (ua.access_overrides->'modules'->med.module_id::text->>'status') = 'locked' THEN false
                                    -- Check if media has a pending delay
                                    WHEN (ua.access_overrides->>'media')::jsonb ? med.id::text 
                                    AND (ua.access_overrides->'media'->med.id::text->>'status') = 'pending'
                                    AND (ua.access_overrides->'media'->med.id::text->'delay') IS NOT NULL
                                    AND (
                                        now() < ua.access_starts_at + 
                                        make_interval(
                                            days := CASE 
                                                WHEN (ua.access_overrides->'media'->med.id::text->'delay'->>'unit') = 'days' THEN 
                                                    (ua.access_overrides->'media'->med.id::text->'delay'->>'value')::int
                                                WHEN (ua.access_overrides->'media'->med.id::text->'delay'->>'unit') = 'weeks' THEN 
                                                    (ua.access_overrides->'media'->med.id::text->'delay'->>'value')::int * 7
                                                WHEN (ua.access_overrides->'media'->med.id::text->'delay'->>'unit') = 'months' THEN 
                                                    (ua.access_overrides->'media'->med.id::text->'delay'->>'value')::int * 30
                                                ELSE 0
                                            END
                                        )
                                    ) THEN false
                                    -- Check if parent module has a pending delay
                                    WHEN (ua.access_overrides->>'modules')::jsonb ? med.module_id::text 
                                    AND (ua.access_overrides->'modules'->med.module_id::text->>'status') = 'pending'
                                    AND (ua.access_overrides->'modules'->med.module_id::text->'delay') IS NOT NULL
                                    AND (
                                        now() < ua.access_starts_at + 
                                        make_interval(
                                            days := CASE 
                                                WHEN (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'unit') = 'days' THEN 
                                                    (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'value')::int
                                                WHEN (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'unit') = 'weeks' THEN 
                                                    (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'value')::int * 7
                                                WHEN (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'unit') = 'months' THEN 
                                                    (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'value')::int * 30
                                                ELSE 0
                                            END
                                        )
                                    ) THEN false
                                    ELSE true
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.target_id = c.id
                            AND ua.type = 'content'
                        ),
                        'access_date', (
                            -- Calculate when media becomes accessible
                            SELECT 
                                CASE
                                    -- If content has a delay, that's the base time
                                    WHEN ua.access_starts_at > now() THEN ua.access_starts_at
                                    -- If media has a pending delay, calculate release date
                                    WHEN (ua.access_overrides->>'media')::jsonb ? med.id::text 
                                    AND (ua.access_overrides->'media'->med.id::text->>'status') = 'pending'
                                    AND (ua.access_overrides->'media'->med.id::text->'delay') IS NOT NULL
                                    THEN
                                        ua.access_starts_at + 
                                        make_interval(
                                            days := CASE 
                                                WHEN (ua.access_overrides->'media'->med.id::text->'delay'->>'unit') = 'days' THEN 
                                                    (ua.access_overrides->'media'->med.id::text->'delay'->>'value')::int
                                                WHEN (ua.access_overrides->'media'->med.id::text->'delay'->>'unit') = 'weeks' THEN 
                                                    (ua.access_overrides->'media'->med.id::text->'delay'->>'value')::int * 7
                                                WHEN (ua.access_overrides->'media'->med.id::text->'delay'->>'unit') = 'months' THEN 
                                                    (ua.access_overrides->'media'->med.id::text->'delay'->>'value')::int * 30
                                                ELSE 0
                                            END
                                        )
                                    -- If parent module has a pending delay, use that
                                    WHEN (ua.access_overrides->>'modules')::jsonb ? med.module_id::text 
                                    AND (ua.access_overrides->'modules'->med.module_id::text->>'status') = 'pending'
                                    AND (ua.access_overrides->'modules'->med.module_id::text->'delay') IS NOT NULL
                                    THEN
                                        ua.access_starts_at + 
                                        make_interval(
                                            days := CASE 
                                                WHEN (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'unit') = 'days' THEN 
                                                    (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'value')::int
                                                WHEN (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'unit') = 'weeks' THEN 
                                                    (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'value')::int * 7
                                                WHEN (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'unit') = 'months' THEN 
                                                    (ua.access_overrides->'modules'->med.module_id::text->'delay'->>'value')::int * 30
                                                ELSE 0
                                            END
                                        )
                                    ELSE ua.access_starts_at
                                END
                            FROM access.user_access ua
                            WHERE ua.user_id = p_user_id 
                            AND ua.target_id = c.id
                            AND ua.type = 'content'
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
                    ) ORDER BY med.order
                )
                from content.media med
                where med.content_id = c.id
            ) as media
        from content.content c
        left join content.collections col on c.collection_id = col.id
    )
    select 
        ua.id,
        ua.target_id as content_id,
        ct.title as content_title,
        ct.type as content_type,
        ct.collection_name,
        ua.granted_at,
        ua.access_starts_at,
        ct.modules,
        ct.media
    from access.user_access ua
    left join content_titles ct on ua.target_id = ct.id
    where ua.user_id = p_user_id
    and ua.type = 'content'
    and ua.access_starts_at <= now()
    -- No need to check access_settings anymore since we're using access_starts_at as base access
    order by ua.granted_at desc;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_content_groups(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_content_groups(UUID) IS 'Returns content groups a user has access to with granular access control based on access_overrides, updated for the new user_access table structure';

-- Update get_content_by_collection function to work with the new user_access table structure
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_content_by_collection(
    p_collection_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    collection_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    has_access BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
AS $$
    SELECT 
        c.id,
        c.collection_id,
        c.title,
        c.description,
        c.status,
        c.thumbnail_url,
        c.created_at,
        c.updated_at,
        -- Simple access check: if a record exists in user_access, they have access
        EXISTS (
            SELECT 1 
            FROM access.user_access ua 
            WHERE ua.user_id = p_user_id 
            AND ua.target_id = c.id
            AND ua.type = 'content'
        ) as has_access
    FROM content.content c
    WHERE c.collection_id = p_collection_id 
    ORDER BY c.created_at DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_by_collection(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_content_by_collection(UUID, UUID) IS 'Returns content in a collection with access information, updated for the new user_access table structure with target_id and type fields';

-- Update test_get_user_access function to work with the new user_access table structure
DROP FUNCTION IF EXISTS public.test_get_user_access(UUID, UUID);

CREATE OR REPLACE FUNCTION public.test_get_user_access(
    p_content_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    target_id UUID,
    type TEXT,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ,
    access_overrides JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, access
AS $$
    SELECT 
        id,
        user_id,
        target_id,
        type,
        granted_at,
        access_starts_at,
        access_overrides
    FROM access.user_access
    WHERE user_id = p_user_id 
    AND target_id = p_content_id
    AND type = 'content';
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.test_get_user_access(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.test_get_user_access(UUID, UUID) IS 'Test function to retrieve user access records, updated for the new user_access table structure with target_id and type fields'; 