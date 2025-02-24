-- Create a function to get content structure without access information
CREATE OR REPLACE FUNCTION public.get_content_structure(
    p_content_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get the raw content structure without access information
    SELECT jsonb_build_object(
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
                    'content_id', m.content_id,
                    'order', m.order,
                    'created_at', m.created_at,
                    'updated_at', m.updated_at,
                    'media', (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', med.id,
                                'title', med.title,
                                'module_id', med.module_id,
                                'content_id', med.content_id,
                                'order', med.order,
                                'created_at', med.created_at,
                                'updated_at', med.updated_at
                            )
                            ORDER BY med.order
                        )
                        FROM content.media med
                        WHERE med.module_id = m.id
                    )
                )
                ORDER BY m.order
            )
            FROM content.modules m
            WHERE m.content_id = p_content_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_structure(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_content_structure(UUID) IS 'Returns content structure without access information, for use in edit mode.'; 