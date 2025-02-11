-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_content_lessons(UUID);

-- Create function to get content by collection
CREATE OR REPLACE FUNCTION public.get_content_by_collection(collection_id UUID)
RETURNS SETOF content.content
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT * FROM content.content 
    WHERE collection_id = collection_id 
    ORDER BY created_at DESC;
$$;

-- Create function to get lessons by content
CREATE OR REPLACE FUNCTION public.get_content_lessons(content_id_param UUID)
RETURNS SETOF content.modules
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT * FROM content.modules 
    WHERE content_id = content_id_param 
    ORDER BY "order" ASC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_by_collection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_lessons(UUID) TO authenticated; 