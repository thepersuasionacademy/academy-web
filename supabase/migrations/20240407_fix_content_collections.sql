-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_learning_collections();
DROP FUNCTION IF EXISTS public.create_learning_collection(text, text);

-- Ensure content schema exists
CREATE SCHEMA IF NOT EXISTS content;

-- Recreate collections table with proper structure
DROP TABLE IF EXISTS content.collections CASCADE;
CREATE TABLE content.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE content.collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read collections" ON content.collections;
DROP POLICY IF EXISTS "Allow authenticated users to create collections" ON content.collections;

-- Create policies
CREATE POLICY "Allow authenticated users to read collections"
    ON content.collections FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to create collections"
    ON content.collections FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Ensure proper permissions
GRANT USAGE ON SCHEMA content TO authenticated;
GRANT ALL ON content.collections TO authenticated;

-- Recreate the functions in public schema
CREATE OR REPLACE FUNCTION public.get_learning_collections()
RETURNS SETOF content.collections
LANGUAGE sql
SECURITY DEFINER
SET search_path = content, public
STABLE
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_learning_collections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_learning_collection(text, text) TO authenticated; 