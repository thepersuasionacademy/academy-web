-- Create a function to delete content and all associated items
CREATE OR REPLACE FUNCTION public.delete_content(
    p_content_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Start transaction
    BEGIN
        -- First, delete all content-specific items
        DELETE FROM content.videos v
        USING content.media m
        WHERE v.media_id = m.id
        AND m.content_id = p_content_id;

        DELETE FROM content.text_content t
        USING content.media m
        WHERE t.media_id = m.id
        AND m.content_id = p_content_id;

        DELETE FROM content.ai_content a
        USING content.media m
        WHERE a.media_id = m.id
        AND m.content_id = p_content_id;

        DELETE FROM content.pdf_content p
        USING content.media m
        WHERE p.media_id = m.id
        AND m.content_id = p_content_id;

        DELETE FROM content.quiz_content q
        USING content.media m
        WHERE q.media_id = m.id
        AND m.content_id = p_content_id;

        -- Then delete all media items
        DELETE FROM content.media
        WHERE content_id = p_content_id;

        -- Delete all modules
        DELETE FROM content.modules
        WHERE content_id = p_content_id;

        -- Delete content stats
        DELETE FROM content.content_stats
        WHERE content_id = p_content_id;

        -- Finally delete the content itself
        DELETE FROM content.content
        WHERE id = p_content_id;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error details
        RAISE NOTICE 'Error deleting content: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        -- Rollback transaction on error
        RAISE EXCEPTION 'Failed to delete content: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_content(UUID) TO authenticated; 