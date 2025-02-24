-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_content_template(UUID);
DROP FUNCTION IF EXISTS public.get_content_template(json);

-- Create a function to get a single content template with its structure
CREATE OR REPLACE FUNCTION public.get_content_template(
    params json
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    content_id UUID,
    access_overrides JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by UUID
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_template_id UUID;
BEGIN
    -- Extract the template ID from the JSON parameters
    v_template_id := (params->>'p_template_id')::UUID;

    -- Return the template data
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.content_id,
        t.access_overrides,
        t.created_at,
        t.updated_at,
        t.created_by
    FROM access.content_templates t
    WHERE t.id = v_template_id
    LIMIT 1;
END;
$$;

-- Grant execute permission to public and anon
GRANT EXECUTE ON FUNCTION public.get_content_template(json) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_content_template(json) TO anon;

-- Add helpful comment
COMMENT ON FUNCTION public.get_content_template(json) IS 'Returns a single content template for viewing.'; 