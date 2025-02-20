-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_media_content(p_media_id uuid);

-- Create the updated function
CREATE OR REPLACE FUNCTION public.get_media_content(p_media_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    WITH media_data AS (
        SELECT 
            m.id,
            m.title,
            m."order",
            -- Get video data if exists
            (
                SELECT jsonb_build_object(
                    'id', v.id,
                    'video_id', v.video_id,
                    'title', COALESCE(v.title, m.title)
                )
                FROM content.videos v
                WHERE v.media_id = m.id
                LIMIT 1
            ) as video,
            -- Get text data if exists
            (
                SELECT jsonb_build_object(
                    'id', t.id,
                    'content_text', t.content_text,
                    'title', COALESCE(t.title, 'Text')
                )
                FROM content.text_content t
                WHERE t.media_id = m.id
                LIMIT 1
            ) as text,
            -- Get AI content data if exists
            (
                SELECT jsonb_build_object(
                    'id', a.id,
                    'tool_id', a.tool_id,
                    'title', COALESCE(a.title, t.title),
                    'tool', (
                        SELECT jsonb_build_object(
                            'id', t.id,
                            'title', t.title,
                            'description', t.description,
                            'credits_cost', t.credits_cost,
                            'status', t.status
                        )
                        FROM ai.tools t
                        WHERE t.id = a.tool_id
                        LIMIT 1
                    )
                )
                FROM content.ai_content a
                LEFT JOIN ai.tools t ON t.id = a.tool_id
                WHERE a.media_id = m.id
                LIMIT 1
            ) as ai,
            -- Get PDF data if exists
            (
                SELECT jsonb_build_object(
                    'id', p.id,
                    'pdf_url', p.pdf_url,
                    'title', COALESCE(p.title, 'Transcript')
                )
                FROM content.pdf_content p
                WHERE p.media_id = m.id
                LIMIT 1
            ) as pdf,
            -- Get quiz data if exists
            (
                SELECT jsonb_build_object(
                    'id', q.id,
                    'quiz_data', q.quiz_data,
                    'title', COALESCE(q.title, 'Quiz')
                )
                FROM content.quiz_content q
                WHERE q.media_id = m.id
                LIMIT 1
            ) as quiz
        FROM content.media m
        WHERE m.id = p_media_id
    )
    SELECT 
        jsonb_build_object(
            'id', md.id,
            'title', md.title,
            'order', md."order",
            'video', COALESCE(md.video, NULL),
            'text', COALESCE(md.text, NULL),
            'ai', COALESCE(md.ai, NULL),
            'pdf', COALESCE(md.pdf, NULL),
            'quiz', COALESCE(md.quiz, NULL)
        )
    INTO v_result
    FROM media_data md;

    RETURN v_result;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_media_content(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_media_content(uuid) TO service_role;

-- Add comment to the function
COMMENT ON FUNCTION public.get_media_content(uuid) IS 'Retrieves all content types (video, text, AI, PDF, quiz) associated with a media item'; 