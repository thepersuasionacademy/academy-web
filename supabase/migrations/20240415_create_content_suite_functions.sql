-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_content_suites_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_content_lessons(UUID);

-- Create function to get suites by collection
CREATE OR REPLACE FUNCTION public.get_content_suites_by_collection(collection_id UUID)
RETURNS SETOF content.suites
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT * FROM content.suites 
    WHERE collection_id = collection_id 
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