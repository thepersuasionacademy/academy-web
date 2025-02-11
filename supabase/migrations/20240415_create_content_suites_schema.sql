-- Create suites table
CREATE TABLE IF NOT EXISTS content.suites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES content.collections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS content.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suite_id UUID REFERENCES content.suites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lesson_type TEXT NOT NULL CHECK (lesson_type IN ('text', 'video')),
    content_text TEXT,
    video_id TEXT,
    "order" INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    tool_id UUID,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE content.suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE content.lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" 
    ON content.suites 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable read access for authenticated users" 
    ON content.lessons 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Grant permissions
GRANT ALL ON content.suites TO authenticated;
GRANT ALL ON content.lessons TO authenticated;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_content_suites_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_content_lessons(UUID);

-- Create function to get suites by collection
CREATE OR REPLACE FUNCTION public.get_content_suites_by_collection(p_collection_id UUID)
RETURNS SETOF content.suites
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT * FROM content.suites 
    WHERE collection_id = p_collection_id 
    ORDER BY title ASC;
$$;

-- Create function to get lessons by suite
CREATE OR REPLACE FUNCTION public.get_content_lessons(suite_id_param UUID)
RETURNS SETOF content.lessons
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT * FROM content.lessons 
    WHERE suite_id = suite_id_param 
    ORDER BY "order" ASC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_suites_by_collection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_lessons(UUID) TO authenticated; 