-- Create RPC functions for bulk access operations through lists
-- Description: Functions for efficiently managing user access in bulk through access lists

-- Function to grant access to all users in a list
CREATE OR REPLACE FUNCTION "access"."grant_list_access"(
    p_list_id UUID,
    p_content_id UUID,
    p_access_settings JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_user_ids UUID[];
    v_count INTEGER;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can grant list access';
    END IF;

    -- Check if list exists
    IF NOT EXISTS (SELECT 1 FROM "access"."access_lists" WHERE "id" = p_list_id) THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- Get all user IDs in the list
    SELECT array_agg("user_id") INTO v_user_ids
    FROM "access"."list_members"
    WHERE "list_id" = p_list_id;

    -- If no users in the list, return 0
    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
        RETURN 0;
    END IF;

    -- Count how many user access records we're creating/updating
    WITH user_access_changes AS (
        INSERT INTO "access"."user_access" ("user_id", "content_id", "access_settings")
        SELECT 
            unnest(v_user_ids), 
            p_content_id, 
            p_access_settings
        ON CONFLICT ("user_id", "content_id") 
        DO UPDATE SET "access_settings" = p_access_settings
        WHERE "access"."user_access"."user_id" = ANY(v_user_ids)
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_count FROM user_access_changes;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke access from all users in a list
CREATE OR REPLACE FUNCTION "access"."revoke_list_access"(
    p_list_id UUID,
    p_content_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_user_ids UUID[];
    v_count INTEGER;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can revoke list access';
    END IF;

    -- Check if list exists
    IF NOT EXISTS (SELECT 1 FROM "access"."access_lists" WHERE "id" = p_list_id) THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- Get all user IDs in the list
    SELECT array_agg("user_id") INTO v_user_ids
    FROM "access"."list_members"
    WHERE "list_id" = p_list_id;

    -- If no users in the list, return 0
    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
        RETURN 0;
    END IF;

    -- Delete user access records for all users in the list
    DELETE FROM "access"."user_access"
    WHERE "user_id" = ANY(v_user_ids) AND "content_id" = p_content_id
    RETURNING COUNT(*) INTO v_count;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync all access for users in a list based on the list's variation
CREATE OR REPLACE FUNCTION "access"."sync_list_variation_access"(
    p_list_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_variation_id UUID;
    v_user_ids UUID[];
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync list variation access';
    END IF;

    -- Get the list's variation ID
    SELECT "variation_id" INTO v_variation_id
    FROM "access"."access_lists"
    WHERE "id" = p_list_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- If no variation is associated with the list, return 0
    IF v_variation_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Get all user IDs in the list
    SELECT array_agg("user_id") INTO v_user_ids
    FROM "access"."list_members"
    WHERE "list_id" = p_list_id;

    -- If no users in the list, return 0
    IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
        RETURN 0;
    END IF;

    -- Grant access based on variation to all users in the list
    WITH variation_content AS (
        SELECT 
            "content_id", 
            "access_settings"
        FROM "access"."access_bundle_variations"
        WHERE "id" = v_variation_id
    ),
    user_access_changes AS (
        INSERT INTO "access"."user_access" ("user_id", "content_id", "access_settings")
        SELECT 
            u, 
            vc."content_id", 
            vc."access_settings"
        FROM unnest(v_user_ids) AS u
        CROSS JOIN variation_content vc
        ON CONFLICT ("user_id", "content_id") 
        DO UPDATE SET "access_settings" = EXCLUDED."access_settings"
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_count FROM user_access_changes;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users with access to specific content
CREATE OR REPLACE FUNCTION "access"."get_users_with_access"(
    p_content_id UUID
) RETURNS TABLE (
    user_id UUID,
    email TEXT,
    via_list TEXT
) AS $$
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can view users with access';
    END IF;

    RETURN QUERY
    WITH direct_access AS (
        -- Users with direct access
        SELECT 
            ua."user_id",
            NULL::TEXT AS list_name
        FROM "access"."user_access" ua
        WHERE ua."content_id" = p_content_id
    ),
    list_access AS (
        -- Users with access via lists
        SELECT 
            lm."user_id",
            al."name" AS list_name
        FROM "access"."list_members" lm
        JOIN "access"."access_lists" al ON lm."list_id" = al."id"
        JOIN "access"."access_bundle_variations" abv ON al."variation_id" = abv."id"
        WHERE abv."content_id" = p_content_id
    ),
    combined_access AS (
        SELECT * FROM direct_access
        UNION
        SELECT * FROM list_access
    )
    SELECT 
        ca."user_id",
        u.email,
        ca.list_name AS via_list
    FROM combined_access ca
    JOIN "auth"."users" u ON ca."user_id" = u.id
    ORDER BY u.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "access"."grant_list_access" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."revoke_list_access" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_list_variation_access" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."get_users_with_access" TO authenticated; 