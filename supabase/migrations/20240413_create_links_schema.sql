-- Create links schema
CREATE SCHEMA IF NOT EXISTS links;

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA links TO authenticated;

-- Create collections table
CREATE TABLE IF NOT EXISTS links.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create suites table
CREATE TABLE IF NOT EXISTS links.suites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES links.collections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create links table
CREATE TABLE IF NOT EXISTS links.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suite_id UUID REFERENCES links.suites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS links.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create link_tags junction table
CREATE TABLE IF NOT EXISTS links.link_tags (
    link_id UUID REFERENCES links.items(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES links.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (link_id, tag_id)
);

-- Create view for collections
CREATE OR REPLACE VIEW collections AS
    SELECT * FROM links.collections;

-- Create view for suites
CREATE OR REPLACE VIEW suites AS
    SELECT * FROM links.suites;

-- Grant access to the views
GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON suites TO authenticated;

-- Enable RLS
ALTER TABLE links.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE links.suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE links.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE links.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE links.link_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage collections" ON links.collections;
DROP POLICY IF EXISTS "Anyone can view collections" ON links.collections;
DROP POLICY IF EXISTS "Anyone can view suites" ON links.suites;
DROP POLICY IF EXISTS "Anyone can view items" ON links.items;
DROP POLICY IF EXISTS "Anyone can view tags" ON links.tags;
DROP POLICY IF EXISTS "Anyone can view link_tags" ON links.link_tags;

-- Create policies
CREATE POLICY "Super admins can manage collections"
    ON links.collections FOR ALL
    USING (public.is_super_admin());

CREATE POLICY "Anyone can view collections"
    ON links.collections FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can view suites"
    ON links.suites FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can view items"
    ON links.items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can view tags"
    ON links.tags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can view link_tags"
    ON links.link_tags FOR SELECT
    TO authenticated
    USING (true);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.list_link_collections();
DROP FUNCTION IF EXISTS public.get_link_suites_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_links_by_suite(UUID);
DROP FUNCTION IF EXISTS public.save_link_changes(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT[]);

-- Create function to list collections
CREATE OR REPLACE FUNCTION public.list_link_collections()
RETURNS SETOF links.collections
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT * FROM links.collections ORDER BY title ASC;
$$;

-- Create function to get suites by collection
CREATE OR REPLACE FUNCTION public.get_link_suites_by_collection(collection_id UUID)
RETURNS SETOF links.suites
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT * FROM links.suites 
    WHERE collection_id = $1 
    ORDER BY title ASC;
$$;

-- Create function to get links by suite
CREATE OR REPLACE FUNCTION public.get_links_by_suite(p_suite_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    url TEXT,
    type TEXT,
    status TEXT,
    suite_id UUID,
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.url,
        i.type,
        i.status,
        i.suite_id,
        i.last_accessed,
        i.created_at,
        array_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
    FROM links.items i
    LEFT JOIN links.link_tags lt ON i.id = lt.link_id
    LEFT JOIN links.tags t ON lt.tag_id = t.id
    WHERE i.suite_id = p_suite_id
    GROUP BY i.id, i.suite_id
    ORDER BY i.created_at DESC;
END;
$$;

-- Create function to save link changes
CREATE OR REPLACE FUNCTION public.save_link_changes(
    p_link_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_url TEXT,
    p_type TEXT,
    p_status TEXT,
    p_suite_id UUID,
    p_tags TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tag_id UUID;
    tag_name TEXT;
    v_link_id UUID;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can update links';
    END IF;

    -- Update or insert link
    INSERT INTO links.items (
        id, title, description, url, type, status, suite_id, updated_at
    ) VALUES (
        COALESCE(p_link_id, gen_random_uuid()),
        p_title,
        p_description,
        p_url,
        p_type,
        p_status,
        p_suite_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        suite_id = EXCLUDED.suite_id,
        updated_at = EXCLUDED.updated_at
    RETURNING id INTO v_link_id;

    -- Delete existing tags for this link if it's an update
    IF p_link_id IS NOT NULL THEN
        DELETE FROM links.link_tags WHERE link_id = p_link_id;
    END IF;

    -- Insert new tags
    IF p_tags IS NOT NULL THEN
        FOR tag_name IN SELECT unnest(p_tags)
        LOOP
            -- Insert tag if it doesn't exist
            INSERT INTO links.tags (name)
            VALUES (tag_name)
            ON CONFLICT (name) DO NOTHING;

            -- Get tag id
            SELECT id INTO tag_id FROM links.tags WHERE name = tag_name;

            -- Insert link_tag
            INSERT INTO links.link_tags (link_id, tag_id)
            VALUES (v_link_id, tag_id);
        END LOOP;
    END IF;

    RETURN true;
END;
$$;

-- Create function to create a collection
CREATE OR REPLACE FUNCTION public.create_link_collection(
    p_title TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS links.collections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_collection links.collections;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can create collections';
    END IF;

    -- Insert new collection
    INSERT INTO links.collections (
        title,
        description
    ) VALUES (
        p_title,
        p_description
    )
    RETURNING * INTO v_collection;

    RETURN v_collection;
END;
$$;

-- Create function to create a suite
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA links TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA links TO authenticated;
GRANT INSERT, UPDATE, DELETE ON links.collections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON links.suites TO authenticated;
GRANT INSERT, UPDATE, DELETE ON links.items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON links.tags TO authenticated;
GRANT INSERT, UPDATE, DELETE ON links.link_tags TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA links TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_link_collections() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_link_suites_by_collection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_links_by_suite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_link_changes(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_link_collection(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_link_suite(TEXT, UUID, TEXT) TO authenticated; 