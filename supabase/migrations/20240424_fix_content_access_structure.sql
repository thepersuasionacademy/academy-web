-- Drop existing function
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_content_groups(UUID);
DROP FUNCTION IF EXISTS public.get_content_groups(UUID);

-- Enable RLS on access.user_access table
ALTER TABLE access.user_access ENABLE ROW LEVEL SECURITY;

-- Drop dependent view first
DROP VIEW IF EXISTS access.user_content_access;

-- Drop access_settings column
ALTER TABLE access.user_access DROP COLUMN IF EXISTS access_settings;

-- Add access_overrides column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'access' 
        AND table_name = 'user_access' 
        AND column_name = 'access_overrides'
    ) THEN
        ALTER TABLE access.user_access ADD COLUMN access_overrides jsonb DEFAULT '{}'::jsonb;
        
        -- Create index for access_overrides
        CREATE INDEX IF NOT EXISTS idx_user_access_overrides ON access.user_access USING gin(access_overrides);
        
        -- Add comment
        COMMENT ON COLUMN access.user_access.access_overrides IS 'JSON containing module and media-specific access overrides';
    END IF;
END $$;

-- Create updated get_user_content_groups function
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
                            AND ua.content_id = c.id
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
                            AND ua.content_id = c.id
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
        ua.granted_at,
        ua.access_starts_at,
        ct.modules,
        ct.media
    from access.user_access ua
    left join content_titles ct on ua.content_id = ct.id
    where ua.user_id = p_user_id
    and ua.access_starts_at <= now()
    -- No need to check access_settings anymore since we're using access_starts_at as base access
    order by ua.granted_at desc;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_content_groups(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_content_groups(UUID) IS 'Returns content groups a user has access to with granular access control based on access_overrides';

-- Create updated get_content_groups function
CREATE OR REPLACE FUNCTION public.get_content_groups(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    content_id UUID,
    content_title TEXT,
    collection_id UUID,
    collection_name TEXT,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ,
    has_access BOOLEAN
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
        -- Since we're moving away from access_settings, just check if access_starts_at has passed
        ua.access_starts_at <= NOW() as has_access
    FROM access.user_access ua
    JOIN content.content c ON c.id = ua.content_id
    LEFT JOIN content.collections col ON col.id = c.collection_id
    WHERE ua.user_id = p_user_id
    ORDER BY ua.granted_at DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_groups(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_content_groups(UUID) IS 'Returns content groups a user has access to, based on access_starts_at';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own access records" ON access.user_access;
DROP POLICY IF EXISTS "Admins can read all access records" ON access.user_access;

-- Create RLS policy for public read access
CREATE POLICY "Public read access"
    ON access.user_access
    FOR SELECT
    TO authenticated
    USING (true);

-- Add helpful comment
COMMENT ON TABLE access.user_access IS 'Stores user access records for content with public read access';

-- Create the function
CREATE OR REPLACE FUNCTION public.get_content_access_structure(
    p_content_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, access, auth
AS $$
DECLARE
    v_result jsonb;
    v_user_access record;
BEGIN
    -- First get the user access record
    SELECT * INTO v_user_access
    FROM access.user_access ua
    WHERE ua.content_id = p_content_id 
    AND ua.user_id = p_user_id;

    -- Build the complete access structure with raw data only
    SELECT jsonb_build_object(
        'user_access', (
            CASE WHEN v_user_access IS NULL THEN NULL
            ELSE jsonb_build_object(
                'id', v_user_access.id,
                'user_id', v_user_access.user_id,
                'content_id', v_user_access.content_id,
                'granted_by', v_user_access.granted_by,
                'granted_at', v_user_access.granted_at,
                'access_starts_at', v_user_access.access_starts_at,
                'access_overrides', v_user_access.access_overrides
            )
            END
        ),
        'content', (
            SELECT row_to_json(c.*)
            FROM content.content c
            WHERE c.id = p_content_id
        ),
        'modules', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'title', m.title,
                    'order', m.order
                )
                ORDER BY m.order
            )
            FROM content.modules m
            WHERE m.content_id = p_content_id
        ),
        'media', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', med.id,
                    'title', med.title,
                    'order', med.order,
                    'module_id', med.module_id
                )
                ORDER BY med.order
            )
            FROM content.media med
            JOIN content.modules m ON m.id = med.module_id
            WHERE m.content_id = p_content_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_access_structure(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_content_access_structure(UUID, UUID) IS 'Returns raw content access structure without access calculations'; 