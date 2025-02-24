-- Create a function to save content template
CREATE OR REPLACE FUNCTION public.save_content_template(
    p_name TEXT,
    p_content_id UUID,
    p_access_overrides JSONB
)
RETURNS access.content_templates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
DECLARE
    v_template access.content_templates;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert new template
    INSERT INTO access.content_templates (
        name,
        content_id,
        access_overrides,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        p_name,
        p_content_id,
        p_access_overrides,
        auth.uid(),
        NOW(),
        NOW()
    )
    RETURNING * INTO v_template;

    RETURN v_template;
EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error saving template: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    -- Rollback transaction on error
    RAISE EXCEPTION 'Failed to save template: %', SQLERRM;
END;
$$;

-- Grant execute permission to public (anyone can execute)
GRANT EXECUTE ON FUNCTION public.save_content_template(TEXT, UUID, JSONB) TO PUBLIC; 