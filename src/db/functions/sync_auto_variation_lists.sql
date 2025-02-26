-- Function to sync all auto-variation lists with explicit variation access only
CREATE OR REPLACE FUNCTION "access"."sync_auto_variation_lists"() RETURNS VOID AS $$
DECLARE
    v_auto_list RECORD;
    v_user_ids UUID[];
BEGIN
    -- Check if the user is an admin
    IF NOT (SELECT is_admin() OR is_super_admin()) THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required';
    END IF;

    -- Process each auto-variation list
    FOR v_auto_list IN (
        SELECT "id", "variation_id" 
        FROM "access"."access_lists" 
        WHERE "list_type" = 'auto_variation' AND "variation_id" IS NOT NULL
    )
    LOOP
        -- Clear current list members
        DELETE FROM "access"."list_members" WHERE "list_id" = v_auto_list.id;
        
        -- Get ONLY users who have been explicitly granted access to the variation
        -- This means they have a direct entry in user_access for the variation itself
        SELECT array_agg(DISTINCT ua."user_id") INTO v_user_ids
        FROM "access"."user_access" ua
        WHERE ua."variation_id" = v_auto_list.variation_id;  -- Only look for direct variation access

        -- If there are users with explicit access, add them to the list
        IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
            INSERT INTO "access"."list_members" ("list_id", "user_id")
            SELECT v_auto_list.id, unnest(v_user_ids);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 