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
    v_module_ids UUID[];
    v_media_ids UUID[];
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

        -- Create an array to store module IDs for deletion check
        SELECT array_agg((value->>'id')::UUID)
        INTO v_module_ids
        FROM jsonb_array_elements(p_content->'modules');

        -- First, delete all content-specific items for media that will be deleted
        DELETE FROM content.videos v
        USING content.media m
        WHERE v.media_id = m.id
        AND m.content_id = p_content_id
        AND (m.module_id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[]))));

        DELETE FROM content.text_content t
        USING content.media m
        WHERE t.media_id = m.id
        AND m.content_id = p_content_id
        AND (m.module_id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[]))));

        DELETE FROM content.ai_content a
        USING content.media m
        WHERE a.media_id = m.id
        AND m.content_id = p_content_id
        AND (m.module_id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[]))));

        DELETE FROM content.pdf_content p
        USING content.media m
        WHERE p.media_id = m.id
        AND m.content_id = p_content_id
        AND (m.module_id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[]))));

        DELETE FROM content.quiz_content q
        USING content.media m
        WHERE q.media_id = m.id
        AND m.content_id = p_content_id
        AND (m.module_id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[]))));

        -- Then delete media items for modules that will be deleted
        DELETE FROM content.media
        WHERE module_id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[])))
        AND content_id = p_content_id;

        -- Finally delete modules that are not in the update
        DELETE FROM content.modules
        WHERE content_id = p_content_id
        AND id NOT IN (SELECT UNNEST(COALESCE(v_module_ids, '{}'::UUID[])));

        -- Update or insert modules with array index as order
        FOR v_module, v_module_index IN 
            SELECT value, (row_number() OVER ())::INTEGER - 1
            FROM jsonb_array_elements(p_content->'modules')
        LOOP
            RAISE NOTICE 'Processing module: %, index/order: %', v_module->>'id', v_module_index;

            -- Insert or update module
            INSERT INTO content.modules (
                id, content_id, title, "order", created_at, updated_at
            )
            VALUES (
                (v_module->>'id')::UUID,
                p_content_id,
                v_module->>'title',
                v_module_index,
                COALESCE((v_module->>'created_at')::TIMESTAMP WITH TIME ZONE, NOW()),
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                "order" = EXCLUDED.order,
                updated_at = NOW();

            -- Create an array to store media IDs for deletion check
            SELECT array_agg((value->>'id')::UUID)
            INTO v_media_ids
            FROM jsonb_array_elements(v_module->'media');

            -- Delete media items that are not in the update
            DELETE FROM content.media
            WHERE module_id = (v_module->>'id')::UUID
            AND content_id = p_content_id
            AND id NOT IN (SELECT UNNEST(COALESCE(v_media_ids, '{}'::UUID[])));

            -- Update or insert media with array index as order
            FOR v_media, v_media_index IN 
                SELECT value, (row_number() OVER ())::INTEGER - 1
                FROM jsonb_array_elements(v_module->'media')
            LOOP
                RAISE NOTICE 'Processing media: %, index/order: %', v_media->>'id', v_media_index;

                -- Insert or update media
                INSERT INTO content.media (
                    id, module_id, content_id, title, "order", created_at, updated_at
                )
                VALUES (
                    (v_media->>'id')::UUID,
                    (v_module->>'id')::UUID,
                    p_content_id,
                    v_media->>'title',
                    v_media_index,
                    COALESCE((v_media->>'created_at')::TIMESTAMP WITH TIME ZONE, NOW()),
                    NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    "order" = EXCLUDED.order,
                    updated_at = NOW();

                -- Delete existing items for this media that are not in the update (with content_id check via media join)
                DELETE FROM content.videos v
                USING content.media m
                WHERE v.media_id = m.id
                AND m.content_id = p_content_id
                AND v.media_id = (v_media->>'id')::UUID 
                AND (v_media->'video' IS NULL OR v.id != (v_media->'video'->>'id')::UUID);

                DELETE FROM content.text_content t
                USING content.media m
                WHERE t.media_id = m.id
                AND m.content_id = p_content_id
                AND t.media_id = (v_media->>'id')::UUID 
                AND (v_media->'text' IS NULL OR t.id != (v_media->'text'->>'id')::UUID);

                DELETE FROM content.ai_content a
                USING content.media m
                WHERE a.media_id = m.id
                AND m.content_id = p_content_id
                AND a.media_id = (v_media->>'id')::UUID 
                AND (v_media->'ai' IS NULL OR a.id != (v_media->'ai'->>'id')::UUID);

                DELETE FROM content.pdf_content p
                USING content.media m
                WHERE p.media_id = m.id
                AND m.content_id = p_content_id
                AND p.media_id = (v_media->>'id')::UUID 
                AND (v_media->'pdf' IS NULL OR p.id != (v_media->'pdf'->>'id')::UUID);

                DELETE FROM content.quiz_content q
                USING content.media m
                WHERE q.media_id = m.id
                AND m.content_id = p_content_id
                AND q.media_id = (v_media->>'id')::UUID 
                AND (v_media->'quiz' IS NULL OR q.id != (v_media->'quiz'->>'id')::UUID);

                -- Process video item if present and has data
                IF v_media->'video' IS NOT NULL AND v_media->'video'->>'title' IS NOT NULL THEN
                    INSERT INTO content.videos (
                        id, media_id, content_id, title, video_id, "order"
                    )
                    VALUES (
                        COALESCE((v_media->'video'->>'id')::UUID, gen_random_uuid()),
                        (v_media->>'id')::UUID,
                        p_content_id,
                        (v_media->'video'->>'title'),
                        (v_media->'video'->>'video_id'),
                        COALESCE((v_media->'video'->>'order')::INTEGER, 0)
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        video_id = EXCLUDED.video_id,
                        "order" = EXCLUDED.order;
                END IF;

                -- Process text item if present and has data
                IF v_media->'text' IS NOT NULL AND (v_media->'text'->>'title' IS NOT NULL OR v_media->'text'->>'content_text' IS NOT NULL) THEN
                    INSERT INTO content.text_content (
                        id, media_id, content_id, title, content_text, "order"
                    )
                    VALUES (
                        COALESCE((v_media->'text'->>'id')::UUID, gen_random_uuid()),
                        (v_media->>'id')::UUID,
                        p_content_id,
                        COALESCE((v_media->'text'->>'title'), ''),
                        COALESCE((v_media->'text'->>'content_text'), ''),
                        COALESCE((v_media->'text'->>'order')::INTEGER, 0)
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        content_text = EXCLUDED.content_text,
                        "order" = EXCLUDED.order;
                END IF;

                -- Process AI item if present and has data
                IF v_media->'ai' IS NOT NULL AND (v_media->'ai'->>'title' IS NOT NULL OR v_media->'ai'->>'tool_id' IS NOT NULL) THEN
                    INSERT INTO content.ai_content (
                        id, media_id, content_id, title, tool_id, "order"
                    )
                    VALUES (
                        COALESCE((v_media->'ai'->>'id')::UUID, gen_random_uuid()),
                        (v_media->>'id')::UUID,
                        p_content_id,
                        COALESCE((v_media->'ai'->>'title'), ''),
                        COALESCE((v_media->'ai'->>'tool_id')::UUID, gen_random_uuid()),
                        COALESCE((v_media->'ai'->>'order')::INTEGER, 0)
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        tool_id = EXCLUDED.tool_id,
                        "order" = EXCLUDED.order;
                END IF;

                -- Process PDF item if present and has data
                IF v_media->'pdf' IS NOT NULL AND (v_media->'pdf'->>'title' IS NOT NULL OR v_media->'pdf'->>'pdf_url' IS NOT NULL) THEN
                    INSERT INTO content.pdf_content (
                        id, media_id, content_id, title, pdf_url, "order"
                    )
                    VALUES (
                        COALESCE((v_media->'pdf'->>'id')::UUID, gen_random_uuid()),
                        (v_media->>'id')::UUID,
                        p_content_id,
                        COALESCE((v_media->'pdf'->>'title'), ''),
                        COALESCE((v_media->'pdf'->>'pdf_url'), ''),
                        COALESCE((v_media->'pdf'->>'order')::INTEGER, 0)
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        pdf_url = EXCLUDED.pdf_url,
                        "order" = EXCLUDED.order;
                END IF;

                -- Process quiz item if present and has data
                IF v_media->'quiz' IS NOT NULL AND (v_media->'quiz'->>'title' IS NOT NULL OR v_media->'quiz'->'quiz_data' IS NOT NULL) THEN
                    INSERT INTO content.quiz_content (
                        id, media_id, content_id, title, quiz_data, "order"
                    )
                    VALUES (
                        COALESCE((v_media->'quiz'->>'id')::UUID, gen_random_uuid()),
                        (v_media->>'id')::UUID,
                        p_content_id,
                        COALESCE((v_media->'quiz'->>'title'), ''),
                        COALESCE((v_media->'quiz'->'quiz_data')::JSONB, '{}'::JSONB),
                        COALESCE((v_media->'quiz'->>'order')::INTEGER, 0)
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        quiz_data = EXCLUDED.quiz_data,
                        "order" = EXCLUDED.order;
                END IF;
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