-- Create a function to get content templates
CREATE OR REPLACE FUNCTION public.get_content_templates(
    p_content_id UUID
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    access_overrides JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Return templates for this content created by the current user
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.access_overrides,
        t.created_at,
        t.updated_at,
        t.created_by
    FROM access.content_templates t
    WHERE t.content_id = p_content_id
        AND t.created_by = auth.uid()
    ORDER BY t.updated_at DESC;
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.get_content_templates(UUID) TO PUBLIC;

-- Add helpful comment
COMMENT ON FUNCTION public.get_content_templates(UUID) IS 'Returns all templates associated with a content ID for the current user.'; 