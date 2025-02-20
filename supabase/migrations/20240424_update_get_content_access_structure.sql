-- Drop existing function
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID, UUID);

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
    v_access_record RECORD;
BEGIN
    -- Get access settings for this content and user
    SELECT 
        access_starts_at,
        access_overrides
    INTO v_access_record
    FROM access.user_access
    WHERE user_id = p_user_id
    AND content_id = p_content_id;

    -- Get content info
    WITH content_data AS (
        SELECT 
            c.id,
            c.title as name,
            'content' as type,
            CASE
                WHEN v_access_record IS NULL THEN false
                WHEN v_access_record.access_starts_at > CURRENT_TIMESTAMP THEN false
                ELSE true
            END as has_access
        FROM content.content c
        WHERE c.id = p_content_id
    ),
    module_data AS (
        SELECT 
            m.id,
            m.title as name,
            'module' as type,
            m.order,
            CASE
                WHEN v_access_record IS NULL THEN false
                WHEN v_access_record.access_starts_at > CURRENT_TIMESTAMP THEN false
                WHEN v_access_record.access_overrides->'modules'->(m.id::text)->>'status' = 'locked' THEN false
                WHEN v_access_record.access_overrides->'modules'->(m.id::text)->>'status' = 'pending' 
                    AND v_access_record.access_starts_at + make_interval(
                        days := (v_access_record.access_overrides->'modules'->(m.id::text)->'delay'->>'value')::int
                    ) > CURRENT_TIMESTAMP THEN false
                ELSE true
            END as has_access,
            CASE
                WHEN v_access_record.access_overrides->'modules'->(m.id::text)->>'status' = 'pending' THEN
                    jsonb_build_object(
                        'value', (v_access_record.access_overrides->'modules'->(m.id::text)->'delay'->>'value')::int,
                        'unit', v_access_record.access_overrides->'modules'->(m.id::text)->'delay'->>'unit'
                    )
                ELSE NULL
            END as access_delay,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', med.id,
                        'name', med.title,
                        'type', 'media',
                        'order', med.order,
                        'has_access', CASE
                            WHEN v_access_record IS NULL THEN false
                            WHEN v_access_record.access_starts_at > CURRENT_TIMESTAMP THEN false
                            WHEN v_access_record.access_overrides->'media'->(med.id::text)->>'status' = 'locked' THEN false
                            WHEN v_access_record.access_overrides->'media'->(med.id::text)->>'status' = 'pending' 
                                AND v_access_record.access_starts_at + make_interval(
                                    days := (v_access_record.access_overrides->'media'->(med.id::text)->'delay'->>'value')::int
                                ) > CURRENT_TIMESTAMP THEN false
                            ELSE true
                        END,
                        'access_delay', CASE
                            WHEN v_access_record.access_overrides->'media'->(med.id::text)->>'status' = 'pending' THEN
                                jsonb_build_object(
                                    'value', (v_access_record.access_overrides->'media'->(med.id::text)->'delay'->>'value')::int,
                                    'unit', v_access_record.access_overrides->'media'->(med.id::text)->'delay'->>'unit'
                                )
                            ELSE NULL
                        END
                    )
                    ORDER BY med.order
                )
                FROM content.media med
                WHERE med.module_id = m.id
            ) as children
        FROM content.modules m
        WHERE m.content_id = p_content_id
        ORDER BY m.order
    )
    SELECT 
        jsonb_build_object(
            'id', cd.id,
            'name', cd.name,
            'type', cd.type,
            'has_access', cd.has_access,
            'children', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', md.id,
                            'name', md.name,
                            'type', md.type,
                            'order', md.order,
                            'has_access', md.has_access,
                            'access_delay', md.access_delay,
                            'children', md.children
                        )
                        ORDER BY md.order
                    )
                    FROM module_data md
                ),
                '[]'::jsonb
            )
        )
    INTO v_result
    FROM content_data cd;

    -- Add debug info to help with migration
    RETURN jsonb_build_object(
        'id', v_result->>'id',
        'name', v_result->>'name',
        'type', v_result->>'type',
        'has_access', v_result->>'has_access',
        'children', v_result->'children',
        'debug_info', jsonb_build_object(
            'access_starts_at', v_access_record.access_starts_at,
            'access_overrides', v_access_record.access_overrides
        )
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_access_structure(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_content_access_structure(UUID, UUID) IS 'Gets content access structure with modules and media items. Access is granted if a record exists, with optional overrides for specific modules/media.'; 