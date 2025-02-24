-- Create a function to get content with template structure
CREATE OR REPLACE FUNCTION public.get_mixed_template_structure(
    p_content_id UUID,
    p_template_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
DECLARE
    v_content_structure JSONB;
    v_template JSONB;
    v_template_overrides JSONB;
    v_result JSONB;
    v_flattened_media JSONB;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- First, verify that the template exists and is for the correct content
    SELECT 
        jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'content_id', t.content_id,
            'created_by', t.created_by,
            'created_at', t.created_at,
            'updated_at', t.updated_at
        ),
        t.access_overrides
    INTO v_template, v_template_overrides
    FROM access.content_templates t
    WHERE t.id = p_template_id;
    
    -- If template not found
    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Check if the template is for the correct content
    IF (v_template->>'content_id')::UUID != p_content_id THEN
        RAISE EXCEPTION 'Template is not for the specified content';
    END IF;
    
    -- Get the content information
    SELECT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'status', c.status,
        'created_at', c.created_at,
        'updated_at', c.updated_at
    )
    INTO v_content_structure
    FROM content.content c
    WHERE c.id = p_content_id;
    
    -- Get all modules for this content
    WITH modules_data AS (
        SELECT
            m.id,
            m.title,
            m.content_id,
            m.order,
            m.created_at,
            m.updated_at,
            (
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
            ) AS media
        FROM content.modules m
        WHERE m.content_id = p_content_id
        ORDER BY m.order
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', md.id,
            'title', md.title,
            'content_id', md.content_id,
            'order', md.order,
            'created_at', md.created_at,
            'updated_at', md.updated_at,
            'media', COALESCE(md.media, '[]'::jsonb)
        )
    )
    INTO v_result
    FROM modules_data md;
    
    -- Flatten all media into a single array for easier access
    SELECT jsonb_agg(m)
    INTO v_flattened_media
    FROM (
        SELECT jsonb_array_elements(module->'media') AS m
        FROM jsonb_array_elements(v_result) AS module
        WHERE module->'media' IS NOT NULL AND jsonb_array_length(module->'media') > 0
    ) AS subq;
    
    -- Build the final result that mimics the structure expected by TemplateMixedAccessView
    RETURN jsonb_build_object(
        'content', v_content_structure,
        'modules', v_result,
        'media', COALESCE(v_flattened_media, '[]'::jsonb),
        'user_access', jsonb_build_object(
            'access_starts_at', CURRENT_TIMESTAMP,
            'access_overrides', v_template_overrides
        ),
        'template', v_template
    );
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION public.get_mixed_template_structure(UUID, UUID) TO PUBLIC;

-- Add helpful comment
COMMENT ON FUNCTION public.get_mixed_template_structure(UUID, UUID) IS 'Returns a hybrid view of content structure mixed with template access overrides.'; 