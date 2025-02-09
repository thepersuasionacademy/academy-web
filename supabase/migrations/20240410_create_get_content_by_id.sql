-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_content_by_id(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_content_by_id(p_content_id UUID)
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

    -- Get content with collection and stats
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
            COALESCE(
                jsonb_build_object(
                    'enrolled_count', cs.enrolled_count,
                    'created_at', cs.created_at,
                    'updated_at', cs.updated_at
                ),
                '{}'::jsonb
            ) as stats
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
            jsonb_agg(
                CASE 
                    WHEN med.id IS NOT NULL THEN
                        jsonb_build_object(
                            'id', med.id,
                            'title', med.title,
                            'order', med.order,
                            'created_at', med.created_at,
                            'updated_at', med.updated_at,
                            'video', (
                                SELECT jsonb_build_object(
                                    'id', v.id,
                                    'video_id', v.video_id,
                                    'title', v.title
                                )
                                FROM content.videos v
                                WHERE v.media_id = med.id
                            ),
                            'text', (
                                SELECT jsonb_build_object(
                                    'id', t.id,
                                    'content_text', t.content_text,
                                    'title', t.title
                                )
                                FROM content.text_content t
                                WHERE t.media_id = med.id
                            ),
                            'ai', (
                                SELECT jsonb_build_object(
                                    'id', a.id,
                                    'tool_id', a.tool_id,
                                    'title', a.title,
                                    'tool', CASE 
                                        WHEN a.tool_id IS NOT NULL THEN
                                            public.get_ai_tool_details(a.tool_id)
                                        ELSE NULL
                                    END
                                )
                                FROM content.ai_content a
                                WHERE a.media_id = med.id
                            ),
                            'pdf', (
                                SELECT jsonb_build_object(
                                    'id', p.id,
                                    'pdf_url', p.pdf_url,
                                    'title', p.title
                                )
                                FROM content.pdf_content p
                                WHERE p.media_id = med.id
                            ),
                            'quiz', (
                                SELECT jsonb_build_object(
                                    'id', q.id,
                                    'quiz_data', q.quiz_data,
                                    'title', q.title
                                )
                                FROM content.quiz_content q
                                WHERE q.media_id = med.id
                            )
                        )
                    ELSE NULL
                END
                ORDER BY med.order
            ) FILTER (WHERE med.id IS NOT NULL) as media
        FROM content.modules m
        LEFT JOIN content.media med ON med.module_id = m.id
        WHERE m.content_id = p_content_id
        GROUP BY m.id, m.title, m.order, m.created_at, m.updated_at
        ORDER BY m.order
    )
    SELECT 
        jsonb_build_object(
            'content', (SELECT row_to_json(cd.*)::jsonb FROM content_data cd),
            'modules', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', module_id,
                        'title', module_title,
                        'order', module_order,
                        'created_at', module_created_at,
                        'updated_at', module_updated_at,
                        'media', COALESCE(media, '[]'::jsonb)
                    )
                    ORDER BY module_order
                )
                FROM modules_data
            ), '[]'::jsonb)
        )
    INTO v_result;

    -- Add debug logging
    RAISE NOTICE 'Content data: %', v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_content_by_id(UUID) TO authenticated;

-- Add comment to help with PostgREST discovery
COMMENT ON FUNCTION public.get_content_by_id(UUID) IS 'Gets content and all related data by content ID'; 