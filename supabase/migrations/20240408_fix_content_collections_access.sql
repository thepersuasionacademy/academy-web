-- Drop any existing functions
DROP FUNCTION IF EXISTS public.get_content_collections();
DROP FUNCTION IF EXISTS public.create_content_collection(text, text);

-- Grant schema usage
GRANT USAGE ON SCHEMA content TO postgres, anon, authenticated, service_role;

-- Grant table access for all content schema tables
GRANT ALL ON content.collections TO postgres, authenticated;
GRANT ALL ON content.content TO postgres, authenticated;
GRANT ALL ON content.modules TO postgres, authenticated;
GRANT ALL ON content.media TO postgres, authenticated;
GRANT ALL ON content.videos TO postgres, authenticated;
GRANT ALL ON content.text_content TO postgres, authenticated;
GRANT ALL ON content.ai_content TO postgres, authenticated;
GRANT ALL ON content.pdf_content TO postgres, authenticated;
GRANT ALL ON content.quiz_content TO postgres, authenticated;
GRANT ALL ON content.content_stats TO postgres, authenticated;

-- Enable RLS on all content schema tables
ALTER TABLE content.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.text_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.pdf_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.quiz_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.content_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.collections;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.collections;

-- Create policies for content.collections
CREATE POLICY "Enable read access for authenticated users"
ON content.collections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON content.collections FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create RPC functions
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

-- Create publication for realtime
DROP PUBLICATION IF EXISTS content_tables;
CREATE PUBLICATION content_tables FOR TABLE 
    content.collections,
    content.content,
    content.modules,
    content.media,
    content.videos,
    content.text_content,
    content.ai_content,
    content.pdf_content,
    content.quiz_content,
    content.content_stats; 