-- Create new enum types
CREATE TYPE public.media_type AS ENUM ('VIDEO', 'TEXT', 'AI', 'PDF', 'QUIZ');
CREATE TYPE public.video_name_type AS ENUM ('VIDEO', 'LESSON', 'IMPRINTING_SESSION');
CREATE TYPE public.pdf_type AS ENUM ('TRANSCRIPT', 'NOTES', 'CUSTOM');
CREATE TYPE public.content_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Rename courses table to content
ALTER TABLE public.courses RENAME TO content;

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create media table
CREATE TABLE IF NOT EXISTS public.media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create media_items table
CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
    type media_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- Video specific fields
    video_id TEXT,
    video_name video_name_type,
    -- Text specific fields
    content_text TEXT,
    -- AI specific fields
    tool_id UUID REFERENCES public.tools(id),
    -- PDF specific fields
    pdf_url TEXT,
    pdf_type pdf_type,
    custom_pdf_type TEXT,
    -- Quiz specific fields
    quiz_data JSONB
);

-- Add RLS policies
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Policies for modules
CREATE POLICY "Allow public read access for published modules" 
    ON public.modules FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.content c
            WHERE c.id = modules.content_id 
            AND c.status = 'PUBLISHED'
        )
    );

CREATE POLICY "Allow content authors to manage modules" 
    ON public.modules FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.content c
            JOIN public.collection_members cm ON c.collection_id = cm.collection_id
            WHERE c.id = modules.content_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Policies for media
CREATE POLICY "Allow public read access for published media" 
    ON public.media FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.content c ON c.id = m.content_id
            WHERE m.id = media.module_id 
            AND c.status = 'PUBLISHED'
        )
    );

CREATE POLICY "Allow content authors to manage media" 
    ON public.media FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.content c ON c.id = m.content_id
            JOIN public.collection_members cm ON c.collection_id = cm.collection_id
            WHERE m.id = media.module_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Policies for media items
CREATE POLICY "Allow public read access for published media items" 
    ON public.media_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.media m
            JOIN public.modules mod ON mod.id = m.module_id
            JOIN public.content c ON c.id = mod.content_id
            WHERE m.id = media_items.media_id 
            AND c.status = 'PUBLISHED'
        )
    );

CREATE POLICY "Allow content authors to manage media items" 
    ON public.media_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.media m
            JOIN public.modules mod ON mod.id = m.module_id
            JOIN public.content c ON c.id = mod.content_id
            JOIN public.collection_members cm ON c.collection_id = cm.collection_id
            WHERE m.id = media_items.media_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Function to get content with modules, media and items
CREATE OR REPLACE FUNCTION public.get_content_with_modules(content_id UUID)
RETURNS TABLE (
    content_data JSON,
    modules_data JSON,
    media_data JSON,
    media_items_data JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        row_to_json(c.*) as content_data,
        json_agg(DISTINCT mod.* ORDER BY mod."order") as modules_data,
        json_agg(DISTINCT m.* ORDER BY m."order") as media_data,
        json_agg(DISTINCT mi.* ORDER BY mi."order") as media_items_data
    FROM public.content c
    LEFT JOIN public.modules mod ON c.id = mod.content_id
    LEFT JOIN public.media m ON mod.id = m.module_id
    LEFT JOIN public.media_items mi ON m.id = mi.media_id
    WHERE c.id = content_id
    GROUP BY c.id, c.collection_id, c.title, c.description, c.created_at, c.updated_at, c.status, c.thumbnail;
END;
$$; 