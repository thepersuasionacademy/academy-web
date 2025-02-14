-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_streaming_content(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_streaming_content(p_content_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get content with collection and modules
    WITH content_data AS (
        SELECT 
            c.id,
            c.collection_id,
            c.title,
            c.description,
            c.status,
            c.thumbnail_url,
            c.created_at,
            c.updated_at,
            jsonb_build_object(
                'id', col.id,
                'name', col.name,
                'description', col.description
            ) as collection,
            jsonb_build_object(
                'enrolled_count', COALESCE(cs.enrolled_count, 0),
                'created_at', COALESCE(cs.created_at, c.created_at),
                'updated_at', COALESCE(cs.updated_at, c.updated_at)
            ) as stats,
            jsonb_build_object(
                'id', c.id,
                'title', c.title,
                'description', c.description,
                'image', c.thumbnail_url,
                'tracks', 1
            ) as grid_item
        FROM content.content c
        LEFT JOIN content.collections col ON col.id = c.collection_id
        LEFT JOIN content.content_stats cs ON cs.content_id = c.id
        WHERE c.id = p_content_id
    ),
    modules_data AS (
        SELECT 
            m.id as module_id,
            m.title as module_title,
            m.order as module_order,
            m.created_at as module_created_at,
            m.updated_at as module_updated_at,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', med.id,
                        'title', med.title,
                        'order', med.order,
                        'video_id', v.video_id,
                        'video_name', v.title,
                        'content_text', t.content_text,
                        'text_title', t.title,
                        'tool_id', a.tool_id,
                        'tool', CASE 
                            WHEN a.tool_id IS NOT NULL THEN
                                public.get_ai_tool_details(a.tool_id)
                            ELSE NULL
                        END,
                        'pdf_url', p.pdf_url,
                        'pdf_title', p.title,
                        'quiz_data', q.quiz_data,
                        'quiz_title', q.title,
                        'created_at', med.created_at,
                        'updated_at', med.updated_at
                    )
                    ORDER BY med.order
                )
                FROM content.media med
                LEFT JOIN content.videos v ON v.media_id = med.id
                LEFT JOIN content.text_content t ON t.media_id = med.id
                LEFT JOIN content.ai_content a ON a.media_id = med.id
                LEFT JOIN content.pdf_content p ON p.media_id = med.id
                LEFT JOIN content.quiz_content q ON q.media_id = med.id
                WHERE med.module_id = m.id
            ) as media
        FROM content.modules m
        WHERE m.content_id = p_content_id
        GROUP BY 
            m.id, 
            m.title,
            m.order, 
            m.created_at, 
            m.updated_at
        ORDER BY m.order
    ),
    category_data AS (
        SELECT 
            jsonb_build_object(
                'name', col.name,
                'items', jsonb_build_array(
                    jsonb_build_object(
                        'id', c.id,
                        'title', c.title,
                        'description', c.description,
                        'image', c.thumbnail_url,
                        'tracks', 1
                    )
                ),
                'categoryType', 'learning'
            ) as category
        FROM content.content c
        LEFT JOIN content.collections col ON col.id = c.collection_id
        WHERE c.id = p_content_id
    )
    SELECT 
        jsonb_build_object(
            'content', (
                SELECT row_to_json(cd.*)::jsonb 
                FROM content_data cd
            ),
            'modules', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', module_id,
                        'title', module_title,
                        'order', module_order,
                        'media', COALESCE(media, '[]'::jsonb),
                        'created_at', module_created_at,
                        'updated_at', module_updated_at
                    )
                    ORDER BY module_order
                )
                FROM modules_data
            ),
            'categories', (
                SELECT jsonb_agg(category)
                FROM category_data
            )
        )
    INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_streaming_content(UUID) TO authenticated;

-- Add comment to help with PostgREST discovery
COMMENT ON FUNCTION public.get_streaming_content(UUID) IS 'Gets content with modules and media items in a format compatible with the streaming interface'; 