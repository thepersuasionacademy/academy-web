-- Grant schema usage
GRANT USAGE ON SCHEMA content TO authenticated;
GRANT USAGE ON SCHEMA content TO public;

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

-- Collections policies
CREATE POLICY "Enable read access for all users" ON content.collections
    FOR SELECT TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON content.collections
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Content policies
CREATE POLICY "Enable read access for published content" ON content.content
    FOR SELECT TO public
    USING (status = 'published');

CREATE POLICY "Enable read access for own draft content" ON content.content
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON content.content
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Modules policies
CREATE POLICY "Enable read access for modules" ON content.modules
    FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM content.content c
        WHERE c.id = content_id
        AND (c.status = 'published' OR auth.uid() IS NOT NULL)
    ));

CREATE POLICY "Enable insert for authenticated users" ON content.modules
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Media policies (similar for all media types)
CREATE POLICY "Enable read access for media" ON content.media
    FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM content.content c
        WHERE c.id = content_id
        AND (c.status = 'published' OR auth.uid() IS NOT NULL)
    ));

CREATE POLICY "Enable insert for authenticated users" ON content.media
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA content TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA content TO authenticated; 