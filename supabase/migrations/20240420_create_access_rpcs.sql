-- Function to get content groups with collection info
CREATE OR REPLACE FUNCTION public.get_user_content_groups(p_user_id UUID)
RETURNS TABLE (
    content_id UUID,
    content_title TEXT,
    collection_id UUID,
    collection_name TEXT,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ
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
        ua.access_starts_at
    FROM access.user_access ua
    JOIN content.content c ON c.id = ua.content_id
    LEFT JOIN content.collections col ON col.id = c.collection_id
    WHERE ua.user_id = p_user_id
    ORDER BY ua.granted_at DESC;
$$;

-- Function to get detailed access structure for a specific content or collection
CREATE OR REPLACE FUNCTION public.get_content_access_structure(
    p_user_id UUID,
    p_id UUID,
    p_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, access
STABLE
AS $$
DECLARE
    result JSONB;
    content_exists BOOLEAN;
BEGIN
    -- First check if the content/collection exists
    IF p_type = 'content' THEN
        SELECT EXISTS (
            SELECT 1 FROM content.content WHERE id = p_id
        ) INTO content_exists;
    ELSIF p_type = 'collection' THEN
        SELECT EXISTS (
            SELECT 1 FROM content.collections WHERE id = p_id
        ) INTO content_exists;
    END IF;

    -- If content doesn't exist, return null
    IF NOT content_exists THEN
        RETURN jsonb_build_object('error', 'Content not found');
    END IF;

    IF p_type = 'content' THEN
        WITH RECURSIVE nodes AS (
            -- Base case: Get the content
            SELECT 
                c.id,
                c.title as name,
                'content' as type,
                ua.access_starts_at,
                ua.metadata->>'accessDelay' as access_delay,
                0 as order_position,
                NULL::uuid as parent_id
            FROM content.content c
            LEFT JOIN access.user_access ua ON ua.content_id = c.id AND ua.user_id = p_user_id
            WHERE c.id = p_id

            UNION ALL

            -- Recursive part: Get modules and media
            SELECT
                child.id,
                child.title as name,
                CASE 
                    WHEN n.type = 'content' THEN 'module'
                    WHEN n.type = 'module' THEN 'media'
                END as type,
                ua.access_starts_at,
                ua.metadata->>'accessDelay' as access_delay,
                COALESCE(child.order, 0) as order_position,
                n.id as parent_id
            FROM nodes n
            LEFT JOIN LATERAL (
                -- Get modules for content
                SELECT m.id, m.title, m.order, 'module' as item_type
                FROM content.modules m
                WHERE n.type = 'content' AND m.content_id = n.id
                UNION ALL
                -- Get media for modules
                SELECT med.id, med.title, med.order, 'media' as item_type
                FROM content.media med
                WHERE n.type = 'module' AND med.module_id = n.id
            ) child ON true
            LEFT JOIN access.user_access ua ON ua.content_id = child.id AND ua.user_id = p_user_id
            WHERE child.id IS NOT NULL
        )
        SELECT jsonb_build_object(
            'id', root.id,
            'name', root.name,
            'type', root.type,
            'hasAccess', CASE WHEN root.access_starts_at IS NOT NULL THEN true ELSE false END,
            'accessDelay', 
                CASE WHEN root.access_delay IS NOT NULL 
                    THEN root.access_delay::jsonb
                    ELSE NULL 
                END,
            'order', root.order_position,
            'children', COALESCE(
                (
                    WITH RECURSIVE tree AS (
                        -- Get immediate children
                        SELECT 
                            n1.id,
                            n1.parent_id,
                            jsonb_build_object(
                                'id', n1.id,
                                'name', n1.name,
                                'type', n1.type,
                                'hasAccess', CASE WHEN n1.access_starts_at IS NOT NULL THEN true ELSE false END,
                                'accessDelay', 
                                    CASE WHEN n1.access_delay IS NOT NULL 
                                        THEN n1.access_delay::jsonb
                                        ELSE NULL 
                                    END,
                                'order', n1.order_position,
                                'children', '[]'::jsonb
                            ) as node
                        FROM nodes n1
                        WHERE n1.parent_id = root.id
                    )
                    SELECT jsonb_agg(node ORDER BY (node->>'order')::int)
                    FROM tree
                ),
                '[]'::jsonb
            )
        )
        INTO result
        FROM nodes root
        WHERE root.parent_id IS NULL;

    ELSIF p_type = 'collection' THEN
        -- Get collection structure with access information
        WITH RECURSIVE collection_structure AS (
            -- Get collection info
            SELECT 
                col.id,
                col.name,
                'collection' as type,
                ua.access_starts_at,
                ua.metadata->>'accessDelay' as access_delay,
                0 as order_position,
                1 as level
            FROM content.collections col
            LEFT JOIN access.user_access ua ON ua.content_id = col.id AND ua.user_id = p_user_id
            WHERE col.id = p_id

            UNION ALL

            -- Get content items
            SELECT 
                c.id,
                c.title as name,
                'content' as type,
                ua.access_starts_at,
                ua.metadata->>'accessDelay' as access_delay,
                0 as order_position,
                cs.level + 1
            FROM collection_structure cs
            JOIN content.content c ON c.collection_id = cs.id
            LEFT JOIN access.user_access ua ON ua.content_id = c.id AND ua.user_id = p_user_id
            WHERE cs.type = 'collection'

            UNION ALL

            -- Get modules
            SELECT 
                m.id,
                m.title as name,
                'module' as type,
                ua.access_starts_at,
                ua.metadata->>'accessDelay' as access_delay,
                m.order as order_position,
                cs.level + 1
            FROM collection_structure cs
            JOIN content.modules m ON m.content_id = cs.id
            LEFT JOIN access.user_access ua ON ua.content_id = m.id AND ua.user_id = p_user_id
            WHERE cs.type = 'content'

            UNION ALL

            -- Get media items
            SELECT 
                med.id,
                med.title as name,
                'media' as type,
                ua.access_starts_at,
                ua.metadata->>'accessDelay' as access_delay,
                med.order as order_position,
                cs.level + 1
            FROM collection_structure cs
            JOIN content.media med ON med.module_id = cs.id
            LEFT JOIN access.user_access ua ON ua.content_id = med.id AND ua.user_id = p_user_id
            WHERE cs.type = 'module'
        )
        -- Build the hierarchical JSON structure
        SELECT jsonb_build_object(
            'id', root.id,
            'name', root.name,
            'type', root.type,
            'hasAccess', CASE WHEN root.access_starts_at IS NOT NULL THEN true ELSE false END,
            'accessDelay', 
                CASE WHEN root.access_delay IS NOT NULL 
                    THEN root.access_delay::jsonb
                    ELSE NULL 
                END,
            'order', root.order_position,
            'children', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', content.id,
                            'name', content.name,
                            'type', content.type,
                            'hasAccess', CASE WHEN content.access_starts_at IS NOT NULL THEN true ELSE false END,
                            'accessDelay', 
                                CASE WHEN content.access_delay IS NOT NULL 
                                    THEN content.access_delay::jsonb
                                    ELSE NULL 
                                END,
                            'order', content.order_position,
                            'children', COALESCE(
                                (
                                    SELECT jsonb_agg(
                                        jsonb_build_object(
                                            'id', modules.id,
                                            'name', modules.name,
                                            'type', modules.type,
                                            'hasAccess', CASE WHEN modules.access_starts_at IS NOT NULL THEN true ELSE false END,
                                            'accessDelay', 
                                                CASE WHEN modules.access_delay IS NOT NULL 
                                                    THEN modules.access_delay::jsonb
                                                    ELSE NULL 
                                                END,
                                            'order', modules.order_position,
                                            'children', COALESCE(
                                                (
                                                    SELECT jsonb_agg(
                                                        jsonb_build_object(
                                                            'id', media.id,
                                                            'name', media.name,
                                                            'type', media.type,
                                                            'hasAccess', CASE WHEN media.access_starts_at IS NOT NULL THEN true ELSE false END,
                                                            'accessDelay', 
                                                                CASE WHEN media.access_delay IS NOT NULL 
                                                                    THEN media.access_delay::jsonb
                                                                    ELSE NULL 
                                                                END,
                                                            'order', media.order_position
                                                        )
                                                        ORDER BY media.order_position
                                                    )
                                                    FROM collection_structure media
                                                    WHERE media.level = modules.level + 1
                                                    AND media.type = 'media'
                                                ),
                                                '[]'::jsonb
                                            )
                                        )
                                        ORDER BY modules.order_position
                                    )
                                    FROM collection_structure modules
                                    WHERE modules.level = content.level + 1
                                    AND modules.type = 'module'
                                ),
                                '[]'::jsonb
                            )
                        )
                        ORDER BY content.order_position
                    )
                    FROM collection_structure content
                    WHERE content.level = root.level + 1
                    AND content.type = 'content'
                ),
                '[]'::jsonb
            )
        )
        INTO result
        FROM collection_structure root
        WHERE root.type = 'collection'
        AND root.level = 1;
    END IF;

    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_content_groups TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_access_structure TO authenticated; 