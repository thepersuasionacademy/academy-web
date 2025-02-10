-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_link_suite;

-- Create function to create a suite in the links schema
CREATE OR REPLACE FUNCTION public.create_link_suite(
    p_title TEXT,
    p_collection_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS links.suites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_suite links.suites;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can create suites';
    END IF;

    -- Insert new suite
    INSERT INTO links.suites (
        title,
        collection_id,
        description
    ) VALUES (
        p_title,
        p_collection_id,
        p_description
    )
    RETURNING * INTO v_suite;

    RETURN v_suite;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_link_suite(TEXT, UUID, TEXT) TO authenticated; 