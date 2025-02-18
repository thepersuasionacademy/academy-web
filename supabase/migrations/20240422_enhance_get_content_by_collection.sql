-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID);
DROP FUNCTION IF EXISTS public.get_content_by_collection(UUID, UUID);

-- Create enhanced function with access integration
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
    has_access BOOLEAN,
    debug_info JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
    WITH user_access_debug AS (
        -- Get ALL user access records for this user, regardless of content
        SELECT 
            ua.content_id,
            jsonb_build_object(
                'found_record', true,
                'content_id', ua.content_id,
                'user_id', ua.user_id,
                'access_settings', ua.access_settings
            ) as debug_info
        FROM access.user_access ua
        WHERE ua.user_id = p_user_id
    )
    SELECT 
        c.id,
        c.collection_id,
        c.title,
        c.description,
        c.status,
        c.thumbnail_url,
        c.created_at,
        c.updated_at,
        -- If we found a user_access record, they have access
        CASE WHEN ua.content_id IS NOT NULL THEN true ELSE false END as has_access,
        COALESCE(
            ua.debug_info,
            jsonb_build_object(
                'found_record', false,
                'checked_user_id', p_user_id,
                'content_id', c.id
            )
        ) as debug_info
    FROM content.content c
    LEFT JOIN user_access_debug ua ON ua.content_id = c.id
    WHERE c.collection_id = p_collection_id 
    ORDER BY c.created_at DESC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_by_collection(UUID, UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.get_content_by_collection(UUID, UUID) IS 'Debug version that shows exactly what user_access records exist.'; 