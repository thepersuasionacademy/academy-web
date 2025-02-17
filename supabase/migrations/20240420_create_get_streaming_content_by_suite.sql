-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_streaming_content_by_suite_id(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_streaming_content_by_suite_id(p_suite_id UUID)
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

    -- Get minimal content data with only necessary fields
    WITH content_data AS (
        SELECT 
            c.id,
            c.title,
            c.description,
            c.thumbnail_url,
            jsonb_build_object(
                'id', col.id,
                'name', col.name
            ) as collection
        FROM content.content c
        LEFT JOIN content.collections col ON col.id = c.collection_id
        WHERE c.id = p_suite_id
    ),
    modules_data AS (
        SELECT 
            m.id as module_id,
            m.title as module_title,
            m.order as module_order,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', med.id,
                        'title', med.title,
                        'order', med.order,
                        'video_id', v.video_id,
                        'video_name', v.title,
                        'text_title', t.title,
                        'tool_id', a.tool_id,
                        'tool', CASE 
                            WHEN a.tool_id IS NOT NULL THEN
                                jsonb_build_object(
                                    'id', tool.id,
                                    'title', tool.title,
                                    'description', tool.description,
                                    'credits_cost', tool.credits_cost
                                )
                            ELSE NULL
                        END,
                        'pdf_url', p.pdf_url,
                        'pdf_title', p.title,
                        'quiz_title', q.title
                    )
                    ORDER BY med.order
                )
                FROM content.media med
                LEFT JOIN content.videos v ON v.media_id = med.id
                LEFT JOIN content.text_content t ON t.media_id = med.id
                LEFT JOIN content.ai_content a ON a.media_id = med.id
                LEFT JOIN content.pdf_content p ON p.media_id = med.id
                LEFT JOIN content.quiz_content q ON q.media_id = med.id
                LEFT JOIN content.ai_tools tool ON tool.id = a.tool_id
                WHERE med.module_id = m.id
            ) as media
        FROM content.modules m
        WHERE m.content_id = p_suite_id
        GROUP BY 
            m.id, 
            m.title,
            m.order
        ORDER BY m.order
    )
    SELECT 
        jsonb_build_object(
            'content', (
                SELECT row_to_json(cd.*)::jsonb 
                FROM content_data cd
            ),
            'modules', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', module_id,
                        'title', module_title,
                        'order', module_order,
                        'media', COALESCE(media, '[]'::jsonb)
                    )
                    ORDER BY module_order
                )
                FROM modules_data
            ), '[]'::jsonb)
        )
    INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_streaming_content_by_suite_id(UUID) TO authenticated;

-- Add comment to help with PostgREST discovery
COMMENT ON FUNCTION public.get_streaming_content_by_suite_id(UUID) IS 'Gets minimal content data with modules and media items'; 