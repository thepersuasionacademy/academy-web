-- Create a function to save all content data in a single transaction
CREATE OR REPLACE FUNCTION public.save_content(
    p_content_id UUID,
    p_content JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, content, auth
AS $$
DECLARE
    v_result JSONB;
    v_module JSONB;
    v_media JSONB;
    v_item JSONB;
    v_module_index INTEGER;
    v_media_index INTEGER;
    v_item_index INTEGER;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Start transaction
    BEGIN
        -- Log incoming data
        RAISE NOTICE 'Content data: %', p_content;

        -- Update content
        UPDATE content.content SET
            title = p_content->>'title',
            description = p_content->>'description',
            status = (p_content->>'status')::content.status_type,
            collection_id = (p_content->>'collection_id')::UUID,
            thumbnail_url = p_content->>'thumbnail_url',
            updated_at = NOW()
        WHERE id = p_content_id;

        -- Update modules with array index as order
        FOR v_module, v_module_index IN 
            SELECT value, (row_number() OVER ())::INTEGER - 1
            FROM jsonb_array_elements(p_content->'modules')
        LOOP
            RAISE NOTICE 'Processing module: %, index/order: %', v_module->>'id', v_module_index;

            UPDATE content.modules SET
                title = v_module->>'title',
                "order" = v_module_index,
                updated_at = NOW()
            WHERE id = (v_module->>'id')::UUID
            AND content_id = p_content_id;

            -- Update media with array index as order
            FOR v_media, v_media_index IN 
                SELECT value, (row_number() OVER ())::INTEGER - 1
                FROM jsonb_array_elements(v_module->'media')
            LOOP
                RAISE NOTICE 'Processing media: %, index/order: %', v_media->>'id', v_media_index;

                UPDATE content.media SET
                    title = v_media->>'title',
                    "order" = v_media_index,
                    updated_at = NOW()
                WHERE id = (v_media->>'id')::UUID
                AND module_id = (v_module->>'id')::UUID;

                -- Update media items with array index as order
                FOR v_item, v_item_index IN 
                    SELECT value, (row_number() OVER ())::INTEGER - 1
                    FROM jsonb_array_elements(v_media->'items')
                LOOP
                    RAISE NOTICE 'Processing item: %, type: %, index/order: %', 
                        v_item->>'id', v_item->>'type', v_item_index;

                    -- Update based on type
                    CASE v_item->>'type'
                        WHEN 'VIDEO' THEN
                            UPDATE content.videos SET
                                title = v_item->>'title',
                                video_id = v_item->>'video_id',
                                "order" = v_item_index,
                                updated_at = NOW()
                            WHERE id = (v_item->>'id')::UUID
                            AND media_id = (v_media->>'id')::UUID;

                        WHEN 'TEXT' THEN
                            UPDATE content.text_content SET
                                title = v_item->>'title',
                                content_text = v_item->>'content_text',
                                "order" = v_item_index,
                                updated_at = NOW()
                            WHERE id = (v_item->>'id')::UUID
                            AND media_id = (v_media->>'id')::UUID;

                        WHEN 'AI' THEN
                            UPDATE content.ai_content SET
                                title = v_item->>'title',
                                tool_id = (v_item->>'tool_id')::UUID,
                                "order" = v_item_index,
                                updated_at = NOW()
                            WHERE id = (v_item->>'id')::UUID
                            AND media_id = (v_media->>'id')::UUID;

                        WHEN 'PDF' THEN
                            UPDATE content.pdf_content SET
                                title = v_item->>'title',
                                pdf_url = v_item->>'pdf_url',
                                "order" = v_item_index,
                                updated_at = NOW()
                            WHERE id = (v_item->>'id')::UUID
                            AND media_id = (v_media->>'id')::UUID;

                        WHEN 'QUIZ' THEN
                            UPDATE content.quiz_content SET
                                title = v_item->>'title',
                                quiz_data = v_item->'quiz_data',
                                "order" = v_item_index,
                                updated_at = NOW()
                            WHERE id = (v_item->>'id')::UUID
                            AND media_id = (v_media->>'id')::UUID;
                    END CASE;
                END LOOP;
            END LOOP;
        END LOOP;

        -- Get updated content
        SELECT public.get_content_by_id(p_content_id) INTO v_result;

        -- Return the result
        RETURN v_result;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error details
        RAISE NOTICE 'Error saving content: %, SQLSTATE: %', SQLERRM, SQLSTATE;
        RAISE NOTICE 'Content data: %', p_content;
        -- Rollback transaction on error
        RAISE EXCEPTION 'Failed to save content: %', SQLERRM;
    END;
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.collections;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.content;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.modules;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.media;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.videos;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.text_content;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.ai_content;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.pdf_content;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.quiz_content;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content.content_stats;

-- Create UPDATE policies for all tables
CREATE POLICY "Enable update for authenticated users" ON content.collections
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.content
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.modules
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.media
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.videos
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.text_content
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.ai_content
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.pdf_content
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.quiz_content
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content.content_stats
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.save_content(UUID, JSONB) TO authenticated; 