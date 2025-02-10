-- Drop and recreate the save_link_changes function
CREATE OR REPLACE FUNCTION public.save_link_changes(
    p_link_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_url TEXT,
    p_type TEXT,
    p_status TEXT,
    p_suite_id UUID,
    p_tags TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tag_id UUID;
    tag_name TEXT;
    v_link_id UUID;
BEGIN
    -- Check if user is admin or super admin
    IF NOT (SELECT (public.is_admin() OR public.is_super_admin())) THEN
        RAISE EXCEPTION 'Only admins can update links';
    END IF;

    -- Update or insert link
    INSERT INTO links.items (
        id, title, description, url, type, status, suite_id, updated_at
    ) VALUES (
        COALESCE(p_link_id, gen_random_uuid()),
        p_title,
        p_description,
        p_url,
        p_type,
        p_status,
        p_suite_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        suite_id = EXCLUDED.suite_id,
        updated_at = EXCLUDED.updated_at
    RETURNING id INTO v_link_id;

    -- Delete existing tags for this link if it's an update
    IF p_link_id IS NOT NULL THEN
        DELETE FROM links.link_tags WHERE link_id = p_link_id;
    END IF;

    -- Insert new tags
    IF p_tags IS NOT NULL THEN
        FOR tag_name IN SELECT unnest(p_tags)
        LOOP
            -- Insert tag if it doesn't exist
            INSERT INTO links.tags (name)
            VALUES (tag_name)
            ON CONFLICT (name) DO NOTHING;

            -- Get tag id
            SELECT id INTO tag_id FROM links.tags WHERE name = tag_name;

            -- Insert link_tag
            INSERT INTO links.link_tags (link_id, tag_id)
            VALUES (v_link_id, tag_id);
        END LOOP;
    END IF;

    RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_link_changes(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT[]) TO authenticated; 