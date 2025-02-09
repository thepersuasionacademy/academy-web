-- Grant usage on content schema to public (needed for RPC functions)
GRANT USAGE ON SCHEMA content TO public;

-- Grant select and insert on collections to public (needed for RPC functions)
GRANT SELECT, INSERT ON content.collections TO public;

-- Recreate the functions with explicit schema permissions
DROP FUNCTION IF EXISTS public.get_learning_collections();
DROP FUNCTION IF EXISTS public.create_learning_collection(text, text);

CREATE OR REPLACE FUNCTION public.get_learning_collections()
RETURNS SETOF content.collections
LANGUAGE sql
SECURITY DEFINER
SET search_path = content, public
AS $$
    SELECT * FROM content.collections
    ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.create_learning_collection(
    p_name text,
    p_description text DEFAULT NULL
)
RETURNS content.collections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = content, public
AS $$
DECLARE
    new_collection content.collections;
BEGIN
    -- Explicitly use schema name
    INSERT INTO content.collections (
        name,
        description,
        created_at,
        updated_at
    ) VALUES (
        p_name,
        p_description,
        NOW(),
        NOW()
    )
    RETURNING * INTO new_collection;
    
    RETURN new_collection;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_learning_collections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_learning_collection(text, text) TO authenticated;

-- Alter the functions to be owned by postgres (superuser)
ALTER FUNCTION public.get_learning_collections() OWNER TO postgres;
ALTER FUNCTION public.create_learning_collection(text, text) OWNER TO postgres; 