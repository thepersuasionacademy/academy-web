-- Function to get content groups with collection info
DROP FUNCTION IF EXISTS public.get_user_content_groups(UUID);

-- Drop old version of the function with all possible signatures
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_user_content_groups(p_user_id UUID)
RETURNS TABLE (
    content_id UUID,
    content_title TEXT,
    collection_id UUID,
    collection_name TEXT,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ,
    has_access BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
    SELECT DISTINCT
        c.id as content_id,
        c.title as content_title,
        col.id as collection_id,
        col.name as collection_name,
        ua.granted_at,
        ua.access_starts_at,
        -- Determine if content has access based on access_starts_at and root node settings
        CASE 
            WHEN ua.access_starts_at > NOW() THEN false
            WHEN (ua.access_settings->0->>'hasAccess')::boolean = false THEN false
            ELSE true
        END as has_access
    FROM access.user_access ua
    JOIN content.content c ON c.id = ua.content_id
    LEFT JOIN content.collections col ON col.id = c.collection_id
    WHERE ua.user_id = p_user_id
    ORDER BY ua.granted_at DESC;
$$;

-- Function to get detailed access structure for content
CREATE OR REPLACE FUNCTION public.get_content_access_structure(
    p_user_id UUID,
    p_content_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
DECLARE
    access_record RECORD;
BEGIN
    -- Get the access record with all its settings
    SELECT access_settings
    INTO access_record
    FROM access.user_access
    WHERE user_id = p_user_id
    AND content_id = p_content_id;

    -- If no access record exists, return a basic structure with no access
    IF access_record IS NULL THEN
        RETURN jsonb_build_object(
            'id', p_content_id,
            'name', (SELECT title FROM content.content WHERE id = p_content_id),
            'type', 'content',
            'hasAccess', false
        );
    END IF;

    -- Just return the first element of the access_settings array
    RETURN access_record.access_settings->0;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_content_groups TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_access_structure TO authenticated; 