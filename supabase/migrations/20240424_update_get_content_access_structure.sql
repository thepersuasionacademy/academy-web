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
BEGIN
    -- Get the raw user access record with ALL fields
    SELECT jsonb_build_object(
        'user_access', (
            SELECT row_to_json(ua.*)
            FROM access.user_access ua
            WHERE ua.content_id = p_content_id 
            AND ua.user_id = p_user_id
        ),
        'content', (
            SELECT row_to_json(c.*)
            FROM content.content c
            WHERE c.id = p_content_id
        ),
        'modules', (
            SELECT jsonb_agg(row_to_json(m.*) ORDER BY m.order)
            FROM content.modules m
            WHERE m.content_id = p_content_id
        ),
        'media', (
            SELECT jsonb_agg(row_to_json(med.*) ORDER BY med.order)
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
COMMENT ON FUNCTION public.get_content_access_structure(UUID, UUID) IS 'Returns completely raw user access record and content data without any transformations.'; 