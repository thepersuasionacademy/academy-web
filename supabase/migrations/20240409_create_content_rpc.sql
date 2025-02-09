-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.collections;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.collections;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.content;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.content;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.modules;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.modules;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.media;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.media;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.videos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.videos;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.text_content;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.text_content;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.ai_content;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.ai_content;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.pdf_content;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.pdf_content;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.quiz_content;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.quiz_content;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.content_stats;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content.content_stats;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_content_collections();
DROP FUNCTION IF EXISTS public.create_content_collection(text,text);
DROP FUNCTION IF EXISTS public.create_content;

-- Drop existing types
DROP TYPE IF EXISTS public.content_input CASCADE;
DROP TYPE IF EXISTS public.module_input CASCADE;
DROP TYPE IF EXISTS public.module_media_input CASCADE;
DROP TYPE IF EXISTS public.module_media_item_input CASCADE;

-- Drop existing tables in reverse order of dependencies with CASCADE
DROP TABLE IF EXISTS content.content_stats CASCADE;
DROP TABLE IF EXISTS content.quiz_content CASCADE;
DROP TABLE IF EXISTS content.pdf_content CASCADE;
DROP TABLE IF EXISTS content.ai_content CASCADE;
DROP TABLE IF EXISTS content.text_content CASCADE;
DROP TABLE IF EXISTS content.videos CASCADE;
DROP TABLE IF EXISTS content.media CASCADE;
DROP TABLE IF EXISTS content.modules CASCADE;
DROP TABLE IF EXISTS content.content CASCADE;
DROP TABLE IF EXISTS content.collections CASCADE;

-- Create the content schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS content;

-- Create status type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE content.status_type AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the tables if they don't exist
CREATE TABLE IF NOT EXISTS content.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL REFERENCES content.collections(id),
    title text NOT NULL,
    description text,
    status content.status_type NOT NULL DEFAULT 'draft',
    thumbnail_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id uuid NOT NULL REFERENCES content.modules(id),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES content.media(id),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    video_id text,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.text_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES content.media(id),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    content_text text,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.ai_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES content.media(id),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    tool_id uuid,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.pdf_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES content.media(id),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    pdf_url text,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.quiz_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES content.media(id),
    content_id uuid NOT NULL REFERENCES content.content(id),
    title text NOT NULL,
    quiz_data jsonb DEFAULT '{}'::jsonb,
    "order" integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.content_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES content.content(id),
    enrolled_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
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

-- Create policies for all tables
CREATE POLICY "Enable read access for authenticated users" ON content.collections
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.collections
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.content
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.modules
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.modules
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.media
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.media
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.videos
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.videos
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.text_content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.text_content
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.ai_content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.ai_content
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.pdf_content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.pdf_content
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.quiz_content
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.quiz_content
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON content.content_stats
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON content.content_stats
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create types for the nested structure
CREATE TYPE public.module_media_item_input AS (
    type text,
    title text,
    video_id text,
    content_text text,
    tool_id uuid,
    pdf_url text,
    quiz_data jsonb,
    "order" integer
);

CREATE TYPE public.module_media_input AS (
    title text,
    items module_media_item_input[],
    "order" integer
);

CREATE TYPE public.module_input AS (
    title text,
    media module_media_input[],
    "order" integer
);

CREATE TYPE public.content_input AS (
    collection_id uuid,
    title text,
    description text,
    status text,
    thumbnail_url text,
    modules module_input[]
);

-- Create the main function
CREATE OR REPLACE FUNCTION public.create_content(
    p_content content_input
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_content_id uuid;
    v_module_id uuid;
    v_media_id uuid;
    v_module module_input;
    v_media module_media_input;
    v_item module_media_item_input;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Add debug logging
    RAISE NOTICE 'Creating content for collection ID: % by user %', p_content.collection_id, auth.uid();

    -- Verify collection exists
    IF NOT EXISTS (SELECT 1 FROM content.collections WHERE id = p_content.collection_id) THEN
        RAISE EXCEPTION 'Collection with ID % does not exist', p_content.collection_id;
    END IF;

    -- Insert content
    INSERT INTO content.content (
        collection_id,
        title,
        description,
        status,
        thumbnail_url,
        created_at,
        updated_at
    ) VALUES (
        p_content.collection_id,
        p_content.title,
        p_content.description,
        COALESCE(LOWER(p_content.status), 'draft')::content.status_type,
        p_content.thumbnail_url,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_content_id;

    -- Add debug logging
    RAISE NOTICE 'Created content with ID: %', v_content_id;

    -- Create initial stats
    INSERT INTO content.content_stats (
        content_id,
        enrolled_count,
        created_at,
        updated_at
    ) VALUES (
        v_content_id,
        0,
        NOW(),
        NOW()
    );

    -- Process modules
    IF p_content.modules IS NOT NULL THEN
        FOREACH v_module IN ARRAY p_content.modules
        LOOP
            -- Insert module
            INSERT INTO content.modules (
                content_id,
                title,
                "order",
                created_at,
                updated_at
            ) VALUES (
                v_content_id,
                v_module.title,
                v_module."order",
                NOW(),
                NOW()
            )
            RETURNING id INTO v_module_id;

            -- Process media for this module
            IF v_module.media IS NOT NULL THEN
                FOREACH v_media IN ARRAY v_module.media
                LOOP
                    -- Insert media
                    INSERT INTO content.media (
                        module_id,
                        content_id,
                        title,
                        "order",
                        created_at,
                        updated_at
                    ) VALUES (
                        v_module_id,
                        v_content_id,
                        v_media.title,
                        v_media."order",
                        NOW(),
                        NOW()
                    )
                    RETURNING id INTO v_media_id;

                    -- Process items for this media
                    IF v_media.items IS NOT NULL THEN
                        FOREACH v_item IN ARRAY v_media.items
                        LOOP
                            -- Insert appropriate content based on type
                            CASE v_item.type
                                WHEN 'VIDEO' THEN
                                    INSERT INTO content.videos (
                                        media_id,
                                        content_id,
                                        title,
                                        video_id,
                                        "order",
                                        created_at,
                                        updated_at
                                    ) VALUES (
                                        v_media_id,
                                        v_content_id,
                                        v_item.title,
                                        v_item.video_id,
                                        v_item."order",
                                        NOW(),
                                        NOW()
                                    );
                                WHEN 'TEXT' THEN
                                    INSERT INTO content.text_content (
                                        media_id,
                                        content_id,
                                        title,
                                        content_text,
                                        "order",
                                        created_at,
                                        updated_at
                                    ) VALUES (
                                        v_media_id,
                                        v_content_id,
                                        v_item.title,
                                        v_item.content_text,
                                        v_item."order",
                                        NOW(),
                                        NOW()
                                    );
                                WHEN 'AI' THEN
                                    INSERT INTO content.ai_content (
                                        media_id,
                                        content_id,
                                        title,
                                        tool_id,
                                        "order",
                                        created_at,
                                        updated_at
                                    ) VALUES (
                                        v_media_id,
                                        v_content_id,
                                        v_item.title,
                                        v_item.tool_id,
                                        v_item."order",
                                        NOW(),
                                        NOW()
                                    );
                                WHEN 'PDF' THEN
                                    INSERT INTO content.pdf_content (
                                        media_id,
                                        content_id,
                                        title,
                                        pdf_url,
                                        "order",
                                        created_at,
                                        updated_at
                                    ) VALUES (
                                        v_media_id,
                                        v_content_id,
                                        v_item.title,
                                        v_item.pdf_url,
                                        v_item."order",
                                        NOW(),
                                        NOW()
                                    );
                                WHEN 'QUIZ' THEN
                                    INSERT INTO content.quiz_content (
                                        media_id,
                                        content_id,
                                        title,
                                        quiz_data,
                                        "order",
                                        created_at,
                                        updated_at
                                    ) VALUES (
                                        v_media_id,
                                        v_content_id,
                                        v_item.title,
                                        COALESCE(v_item.quiz_data, '{}'::jsonb),
                                        v_item."order",
                                        NOW(),
                                        NOW()
                                    );
                            END CASE;
                        END LOOP;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END IF;

    RETURN v_content_id;
END;
$$;

-- Create collection management functions
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

    -- Add debug logging
    RAISE NOTICE 'Fetching collections for user %', auth.uid();
    
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

    -- Add debug logging
    RAISE NOTICE 'Creating collection with name: % for user %', p_name, auth.uid();

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

    -- Add debug logging
    RAISE NOTICE 'Created collection with ID: %', v_collection.id;

    RETURN v_collection;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_content(content_input) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_collections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_content_collection(text, text) TO authenticated;

-- Grant schema usage
GRANT USAGE ON SCHEMA content TO postgres, anon, authenticated, service_role;

-- Grant table access
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