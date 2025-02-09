-- First, let's check if our functions exist and drop them if they do
SELECT format('DROP FUNCTION IF EXISTS %s;', oid::regprocedure)
FROM pg_proc
WHERE proname IN ('get_learning_collections', 'create_learning_collection')
AND pronamespace = 'public'::regnamespace;

-- Now recreate them with verbose error handling
CREATE OR REPLACE FUNCTION public.get_learning_collections()
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = content, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.updated_at
    FROM content.collections c;
    
    -- If no rows found, raise a notice
    IF NOT FOUND THEN
        RAISE NOTICE 'No collections found';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE EXCEPTION 'Table content.collections does not exist';
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Insufficient privileges to access content.collections';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_learning_collection(
    p_name text,
    p_description text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = content, public
AS $$
BEGIN
    RETURN QUERY
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
    RETURNING 
        id,
        name,
        description,
        created_at,
        updated_at;
    
    -- If no rows returned, something went wrong
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to create collection';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE EXCEPTION 'Table content.collections does not exist';
    WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'Insufficient privileges to access content.collections';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error: % %', SQLERRM, SQLSTATE;
END;
$$;

-- Make sure public has usage on content schema
GRANT USAGE ON SCHEMA content TO public;
GRANT USAGE ON SCHEMA content TO authenticated;

-- Make sure public and authenticated roles have access to the collections table
GRANT SELECT, INSERT ON content.collections TO public;
GRANT SELECT, INSERT ON content.collections TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_learning_collections() TO public;
GRANT EXECUTE ON FUNCTION public.get_learning_collections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_learning_collection(text, text) TO public;
GRANT EXECUTE ON FUNCTION public.create_learning_collection(text, text) TO authenticated;

-- Set function ownership to postgres
ALTER FUNCTION public.get_learning_collections() OWNER TO postgres;
ALTER FUNCTION public.create_learning_collection(text, text) OWNER TO postgres;

-- Test insert a collection
DO $$
BEGIN
    INSERT INTO content.collections (name, description)
    VALUES ('Test Collection', 'This is a test collection')
    ON CONFLICT DO NOTHING;
END;
$$;

-- Verify the functions work
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Test get_learning_collections
    FOR test_result IN SELECT * FROM public.get_learning_collections() LOOP
        RAISE NOTICE 'Found collection: % (ID: %)', test_result.name, test_result.id;
    END LOOP;
    
    -- Test create_learning_collection
    FOR test_result IN SELECT * FROM public.create_learning_collection('Test Collection 2', 'Another test collection') LOOP
        RAISE NOTICE 'Created collection: % (ID: %)', test_result.name, test_result.id;
    END LOOP;
END;
$$; 