-- Update the save_content_template function to handle updates
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

    -- Try to update existing template first
    UPDATE access.content_templates
    SET
        content_id = p_content_id,
        access_overrides = p_access_overrides,
        updated_at = NOW()
    WHERE name = p_name
        AND created_by = auth.uid()
    RETURNING * INTO v_template;

    -- If no template was updated (v_template is null), insert new one
    IF v_template IS NULL THEN
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
    END IF;

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

-- Add helpful comment
COMMENT ON FUNCTION public.save_content_template(TEXT, UUID, JSONB) IS 'Saves or updates a content access template. Updates existing template if name exists for the user, otherwise creates new.'; 