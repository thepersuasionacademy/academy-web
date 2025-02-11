-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_content_cards(UUID);

-- Create function to get content by collection
CREATE OR REPLACE FUNCTION public.get_content_by_collection(p_collection_id UUID)
RETURNS TABLE (
    id UUID,
    collection_id UUID,
    title TEXT,
    description TEXT,
    status content.status_type,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT 
        id,
        collection_id,
        title,
        description,
        status,
        thumbnail_url,
        created_at,
        updated_at
    FROM content.content 
    WHERE collection_id = p_collection_id 
    ORDER BY created_at DESC;
$$;

-- Create function to get cards by content
CREATE OR REPLACE FUNCTION public.get_content_cards(p_content_id UUID)
RETURNS SETOF content.modules
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content
STABLE
AS $$
    SELECT * FROM content.modules 
    WHERE content_id = p_content_id 
    ORDER BY "order" ASC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_by_collection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_cards(UUID) TO authenticated; 