-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_content_collections();
DROP FUNCTION IF EXISTS public.create_content_collection(text, text);

-- Function to get all content collections
CREATE OR REPLACE FUNCTION public.get_content_collections()
RETURNS SETOF content.collections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT *
    FROM content.collections
    ORDER BY created_at DESC;
END;
$$;

-- Function to create a new content collection
CREATE OR REPLACE FUNCTION public.create_content_collection(
    p_name text,
    p_description text DEFAULT NULL
)
RETURNS content.collections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_collection content.collections;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate input
    IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
        RAISE EXCEPTION 'Collection name is required';
    END IF;

    -- Insert new collection
    INSERT INTO content.collections (
        name,
        description,
        created_at,
        updated_at
    )
    VALUES (
        trim(p_name),
        p_description,
        now(),
        now()
    )
    RETURNING * INTO v_collection;

    RETURN v_collection;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_collections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_content_collection(text, text) TO authenticated; 