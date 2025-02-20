-- Drop existing function
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID, UUID);

-- Create simplified function with basic access check
CREATE OR REPLACE FUNCTION public.get_content_by_collection(
    p_collection_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    collection_id UUID,
    title TEXT,
    description TEXT,
    status content.status_type,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    has_access BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
    SELECT 
        c.id,
        c.collection_id,
        c.title,
        c.description,
        c.status,
        c.thumbnail_url,
        c.created_at,
        c.updated_at,
        -- Simple access check: if a record exists in user_access, they have access
        EXISTS (
            SELECT 1 
            FROM access.user_access ua 
            WHERE ua.user_id = p_user_id 
            AND ua.content_id = c.id
        ) as has_access
    FROM content.content c
    WHERE c.collection_id = p_collection_id 
    ORDER BY c.created_at DESC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_by_collection(UUID, UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.get_content_by_collection(UUID, UUID) IS 'Returns content for a collection with simplified access check based on user_access record existence.'; 