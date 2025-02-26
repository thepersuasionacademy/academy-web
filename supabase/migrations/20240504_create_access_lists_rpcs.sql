-- Create RPC functions for access list management
-- Description: Functions to create, update, delete, and query access lists and their members

-- Check if required tables exist
DO $$
BEGIN
    -- Check that prerequisite tables exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'access' AND table_name = 'access_lists'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table "access.access_lists" does not exist. Please run prior migrations first.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'access' AND table_name = 'list_members'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table "access.list_members" does not exist. Please run prior migrations first.';
    END IF;
END $$;

-- Function to create a new access list
CREATE OR REPLACE FUNCTION "access"."create_access_list"(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_variation_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_list_id UUID;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can create access lists';
    END IF;

    -- Insert new access list
    INSERT INTO "access"."access_lists" (
        "name",
        "description",
        "variation_id"
    ) VALUES (
        p_name,
        p_description,
        p_variation_id
    ) RETURNING "id" INTO v_list_id;

    RETURN v_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update an existing access list
CREATE OR REPLACE FUNCTION "access"."update_access_list"(
    p_list_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_variation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_name TEXT;
    v_current_description TEXT;
    v_current_variation_id UUID;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can update access lists';
    END IF;

    -- Get current values
    SELECT 
        "name", 
        "description", 
        "variation_id"
    INTO 
        v_current_name, 
        v_current_description, 
        v_current_variation_id
    FROM "access"."access_lists"
    WHERE "id" = p_list_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- Update access list with new values or keep current ones if not provided
    UPDATE "access"."access_lists"
    SET 
        "name" = COALESCE(p_name, v_current_name),
        "description" = COALESCE(p_description, v_current_description),
        "variation_id" = COALESCE(p_variation_id, v_current_variation_id)
    WHERE "id" = p_list_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete an access list
CREATE OR REPLACE FUNCTION "access"."delete_access_list"(
    p_list_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can delete access lists';
    END IF;

    -- Delete the access list (cascade will remove list_members)
    DELETE FROM "access"."access_lists"
    WHERE "id" = p_list_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all access lists or filter by variation_id
CREATE OR REPLACE FUNCTION "access"."get_access_lists"(
    p_variation_id UUID DEFAULT NULL
) RETURNS SETOF "access"."access_lists" AS $$
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can view access lists';
    END IF;

    -- Return all lists or filter by variation_id if provided
    RETURN QUERY
    SELECT *
    FROM "access"."access_lists"
    WHERE 
        (p_variation_id IS NULL OR "variation_id" = p_variation_id)
    ORDER BY "name" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add users to a list
CREATE OR REPLACE FUNCTION "access"."add_users_to_list"(
    p_list_id UUID,
    p_user_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can add users to lists';
    END IF;

    -- Check if list exists
    IF NOT EXISTS (SELECT 1 FROM "access"."access_lists" WHERE "id" = p_list_id) THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- Add each user to the list
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        -- Insert the user into the list if they don't already exist in it
        BEGIN
            INSERT INTO "access"."list_members" ("list_id", "user_id")
            VALUES (p_list_id, v_user_id)
            ON CONFLICT ("list_id", "user_id") DO NOTHING;
            
            -- Count only if a new row was inserted
            IF FOUND THEN
                v_count := v_count + 1;
            END IF;
        EXCEPTION WHEN foreign_key_violation THEN
            -- Skip users that don't exist in auth.users
            CONTINUE;
        END;
    END LOOP;

    -- Sync user access for all affected users
    PERFORM "access"."sync_user_access"(p_user_ids);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove users from a list
CREATE OR REPLACE FUNCTION "access"."remove_users_from_list"(
    p_list_id UUID,
    p_user_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_affected_users UUID[];
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can remove users from lists';
    END IF;

    -- Store affected users for access sync
    SELECT array_agg("user_id") INTO v_affected_users
    FROM "access"."list_members"
    WHERE "list_id" = p_list_id AND "user_id" = ANY(p_user_ids);

    -- Remove users from the list
    DELETE FROM "access"."list_members"
    WHERE "list_id" = p_list_id AND "user_id" = ANY(p_user_ids)
    RETURNING COUNT(*) INTO v_count;

    -- Sync user access for all affected users
    IF v_affected_users IS NOT NULL THEN
        PERFORM "access"."sync_user_access"(v_affected_users);
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all members of a list
CREATE OR REPLACE FUNCTION "access"."get_list_members"(
    p_list_id UUID
) RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if current user is admin or super_admin
    IF auth.jwt() ->> 'role' != 'admin' AND auth.jwt() ->> 'role' != 'super_admin' THEN
        RAISE EXCEPTION 'Only administrators can view list members';
    END IF;

    -- Check if list exists
    IF NOT EXISTS (SELECT 1 FROM "access"."access_lists" WHERE "id" = p_list_id) THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- Return list members with their email
    RETURN QUERY
    SELECT 
        lm."user_id",
        u.email,
        lm."created_at"
    FROM "access"."list_members" lm
    JOIN "auth"."users" u ON lm."user_id" = u.id
    WHERE lm."list_id" = p_list_id
    ORDER BY u.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync user access based on list membership
CREATE OR REPLACE FUNCTION "access"."sync_user_access"(
    p_user_ids UUID[]
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_variation_id UUID;
    v_content_id UUID;
BEGIN
    -- Process each user
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        -- Get all variation IDs associated with the user through lists
        FOR v_variation_id IN (
            SELECT DISTINCT al."variation_id"
            FROM "access"."list_members" lm
            JOIN "access"."access_lists" al ON lm."list_id" = al."id"
            WHERE lm."user_id" = v_user_id AND al."variation_id" IS NOT NULL
        )
        LOOP
            -- Get all content IDs associated with the variation
            FOR v_content_id IN (
                SELECT "content_id"
                FROM "access"."access_bundle_variations" abv
                WHERE abv."id" = v_variation_id
            )
            LOOP
                -- Grant access to the content for this user
                -- This is a simplified version - modify based on your actual access model
                INSERT INTO "access"."user_access" ("user_id", "content_id")
                VALUES (v_user_id, v_content_id)
                ON CONFLICT ("user_id", "content_id") DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "access"."create_access_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."update_access_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."delete_access_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."get_access_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."add_users_to_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."remove_users_from_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."get_list_members" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_user_access" TO authenticated; 