-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_streaming_content_by_suite_id(UUID);
DROP FUNCTION IF EXISTS public.get_streaming_content_by_suite_id(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID);
DROP FUNCTION IF EXISTS public.get_content_access_structure(UUID, UUID);

-- Create access structure function
CREATE OR REPLACE FUNCTION public.get_content_access_structure(
    p_content_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, access, auth
AS $$
DECLARE
    v_result jsonb;
    v_access_settings jsonb;
    v_access_starts_at timestamptz;
BEGIN
    -- Get access settings for this content and user
    SELECT 
        ua.access_settings,
        ua.access_starts_at
    INTO v_access_settings, v_access_starts_at
    FROM access.user_access ua
    WHERE ua.user_id = p_user_id
    AND ua.content_id = p_content_id;

    -- Get content info
    WITH content_data AS (
        SELECT 
            c.id,
            c.title as name,
            'content' as type
        FROM content.content c
        WHERE c.id = p_content_id
    ),
    module_data AS (
        SELECT 
            m.id,
            m.title as name,
            'module' as type,
            m.order,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', med.id,
                        'name', med.title,
                        'type', 'media'
                    )
                    ORDER BY med.order
                )
                FROM content.media med
                WHERE med.module_id = m.id
            ) as children
        FROM content.modules m
        WHERE m.content_id = p_content_id
    )
    SELECT 
        jsonb_build_object(
            'id', cd.id,
            'name', cd.name,
            'type', cd.type,
            'access_settings', v_access_settings,
            'access_starts_at', v_access_starts_at,
            'children', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', md.id,
                            'name', md.name,
                            'type', md.type,
                            'children', md.children
                        )
                        ORDER BY md.order
                    )
                    FROM module_data md
                ),
                '[]'::jsonb
            )
        )
    INTO v_result
    FROM content_data cd;

    RETURN v_result;
END;
$$;

-- Create simple media content fetcher
CREATE OR REPLACE FUNCTION public.get_media_content(
    p_media_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_result jsonb;
BEGIN
    WITH media_data AS (
        SELECT 
            m.id,
            m.title,
            m.order,
            -- Get video data if exists
            (
                SELECT jsonb_build_object(
                    'id', v.id,
                    'video_id', v.video_id,
                    'title', v.title
                )
                FROM content.videos v
                WHERE v.media_id = m.id
            ) as video,
            -- Get text data if exists
            (
                SELECT jsonb_build_object(
                    'id', t.id,
                    'content_text', t.content_text,
                    'title', t.title
                )
                FROM content.text_content t
                WHERE t.media_id = m.id
            ) as text,
            -- Get AI content data if exists
            (
                SELECT jsonb_build_object(
                    'id', a.id,
                    'tool_id', a.tool_id,
                    'title', a.title
                )
                FROM content.ai_content a
                WHERE a.media_id = m.id
            ) as ai,
            -- Get PDF data if exists
            (
                SELECT jsonb_build_object(
                    'id', p.id,
                    'pdf_url', p.pdf_url,
                    'title', p.title
                )
                FROM content.pdf_content p
                WHERE p.media_id = m.id
            ) as pdf,
            -- Get quiz data if exists
            (
                SELECT jsonb_build_object(
                    'id', q.id,
                    'quiz_data', q.quiz_data,
                    'title', q.title
                )
                FROM content.quiz_content q
                WHERE q.media_id = m.id
            ) as quiz
        FROM content.media m
        WHERE m.id = p_media_id
    )
    SELECT 
        jsonb_build_object(
            'id', md.id,
            'title', md.title,
            'order', md.order,
            'video', md.video,
            'text', md.text,
            'ai', md.ai,
            'pdf', md.pdf,
            'quiz', md.quiz
        )
    INTO v_result
    FROM media_data md;

    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_access_structure(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_media_content(UUID) TO authenticated;

-- Add comments for PostgREST discovery
COMMENT ON FUNCTION public.get_content_access_structure(UUID, UUID) IS 'Gets content access structure with modules and media items';
COMMENT ON FUNCTION public.get_media_content(UUID) IS 'Gets media content data by media ID'; 