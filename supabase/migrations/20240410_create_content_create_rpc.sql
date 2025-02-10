-- Create a function to create new content
CREATE OR REPLACE FUNCTION public.create_content(
    p_title TEXT,
    p_collection_id UUID
)
RETURNS content.content
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_content content.content;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert new content
    INSERT INTO content.content (
        id,
        title,
        collection_id,
        status,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        p_title,
        p_collection_id,
        'draft'::content.status_type,
        NOW(),
        NOW()
    )
    RETURNING * INTO v_content;

    -- Create initial content stats
    INSERT INTO content.content_stats (
        content_id,
        enrolled_count,
        created_at,
        updated_at
    )
    VALUES (
        v_content.id,
        0,
        NOW(),
        NOW()
    );

    RETURN v_content;
EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error creating content: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    -- Rollback transaction on error
    RAISE EXCEPTION 'Failed to create content: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_content(TEXT, UUID) TO authenticated; 