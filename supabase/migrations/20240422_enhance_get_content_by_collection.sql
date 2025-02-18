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
    has_any_media_access BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
    WITH content_access AS (
        SELECT 
            ua.content_id,
            -- Basic access check for content level
            CASE 
                WHEN ua.access_starts_at > NOW() THEN false
                WHEN (ua.access_settings->0->>'hasAccess')::boolean = false THEN false
                ELSE true
            END as has_access,
            -- Check if ANY media items are immediately accessible
            EXISTS (
                SELECT 1
                FROM jsonb_array_elements(ua.access_settings->0->'children') as module,
                     jsonb_array_elements(module->'children') as media
                WHERE (module->>'hasAccess')::boolean = true
                  AND (media->>'hasAccess')::boolean = true
                  -- Only check immediate access (no drip delay)
                  AND (module->'accessDelay') IS NULL
                  AND (media->'accessDelay') IS NULL
            ) as has_any_media_access
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
        COALESCE(ca.has_access, false) as has_access,
        COALESCE(ca.has_any_media_access, false) as has_any_media_access
    FROM content.content c
    LEFT JOIN content_access ca ON ca.content_id = c.id
    WHERE c.collection_id = p_collection_id 
    ORDER BY c.created_at DESC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_by_collection(UUID, UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.get_content_by_collection(UUID, UUID) IS 'Get content by collection with basic access information. Returns content items with their immediate access status, ignoring drip settings.'; 