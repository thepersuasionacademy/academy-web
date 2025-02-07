-- Create enum types
CREATE TYPE public.lesson_type AS ENUM ('VIDEO', 'TEXT', 'QUIZ');
CREATE TYPE public.lesson_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES public.collections(id),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT,
    thumbnail TEXT
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    lesson_type lesson_type NOT NULL,
    content_text TEXT,
    video_id TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status lesson_status DEFAULT 'DRAFT',
    tool_id UUID REFERENCES public.tools(id)
);

-- Add RLS policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Policies for courses
CREATE POLICY "Allow public read access for published courses" 
    ON public.courses FOR SELECT 
    USING (status = 'PUBLISHED');

CREATE POLICY "Allow authors to manage their courses" 
    ON public.courses FOR ALL 
    USING (auth.uid() IN (
        SELECT user_id FROM public.collection_members 
        WHERE collection_id = courses.collection_id
    ));

-- Policies for lessons
CREATE POLICY "Allow public read access for published lessons of published courses" 
    ON public.lessons FOR SELECT 
    USING (
        status = 'PUBLISHED' AND 
        EXISTS (
            SELECT 1 FROM public.courses 
            WHERE courses.id = lessons.course_id 
            AND courses.status = 'PUBLISHED'
        )
    );

CREATE POLICY "Allow course authors to manage lessons" 
    ON public.lessons FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            JOIN public.collection_members cm ON c.collection_id = cm.collection_id
            WHERE c.id = lessons.course_id 
            AND cm.user_id = auth.uid()
        )
    );

-- Create function to get course with lessons
CREATE OR REPLACE FUNCTION public.get_course_with_lessons(course_id UUID)
RETURNS TABLE (
    course_data JSON,
    lessons_data JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        row_to_json(c.*) as course_data,
        json_agg(l.* ORDER BY l."order") as lessons_data
    FROM public.courses c
    LEFT JOIN public.lessons l ON c.id = l.course_id
    WHERE c.id = course_id
    GROUP BY c.id, c.collection_id, c.title, c.description, c.created_at, c.updated_at, c.status, c.thumbnail;
END;
$$; 