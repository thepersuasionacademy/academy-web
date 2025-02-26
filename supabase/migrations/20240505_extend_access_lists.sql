-- Extend access lists functionality with two-tier structure
-- Description: Add support for auto-generated bundle/variation lists and custom combination lists

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
END $$;

-- Alter access_lists table to add list_type and bundle_id
ALTER TABLE "access"."access_lists"
ADD COLUMN IF NOT EXISTS "list_type" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS "bundle_id" UUID REFERENCES "access"."bundles"("id") ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "source_lists" UUID[],
ADD COLUMN IF NOT EXISTS "list_operation" TEXT;

-- Add check constraint to ensure valid list_type values
ALTER TABLE "access"."access_lists"
ADD CONSTRAINT "access_lists_list_type_check" 
CHECK ("list_type" IN ('auto_bundle', 'auto_variation', 'custom', 'combination'));

-- Create a function to auto-generate lists for all bundles
CREATE OR REPLACE FUNCTION "access"."generate_bundle_lists"() RETURNS INTEGER AS $$
DECLARE
    v_bundle RECORD;
    v_list_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can generate bundle lists';
    END IF;

    -- Loop through all bundles and create auto-lists for them
    FOR v_bundle IN (
        SELECT "id", "name" 
        FROM "access"."bundles"
    )
    LOOP
        -- Create an auto-generated list for this bundle if it doesn't exist
        INSERT INTO "access"."access_lists" (
            "name", 
            "description", 
            "list_type", 
            "bundle_id"
        ) VALUES (
            'Auto: ' || v_bundle.name, 
            'Auto-generated list for all users with access to ' || v_bundle.name, 
            'auto_bundle', 
            v_bundle.id
        )
        ON CONFLICT ("name") DO NOTHING
        RETURNING "id" INTO v_list_id;
        
        IF v_list_id IS NOT NULL THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    -- Sync the auto-generated bundle lists with current user access
    PERFORM "access"."sync_auto_bundle_lists"();

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to auto-generate lists for all variations
CREATE OR REPLACE FUNCTION "access"."generate_variation_lists"() RETURNS INTEGER AS $$
DECLARE
    v_variation RECORD;
    v_list_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can generate variation lists';
    END IF;

    -- Loop through all variations and create auto-lists for them
    FOR v_variation IN (
        SELECT bv."id", bv."variation_name" as name, b."name" AS bundle_name
        FROM "access"."bundle_variations" bv
        JOIN "access"."bundles" b ON bv."bundle_id" = b."id"
    )
    LOOP
        -- Create an auto-generated list for this variation if it doesn't exist
        INSERT INTO "access"."access_lists" (
            "name", 
            "description", 
            "list_type", 
            "variation_id"
        ) VALUES (
            'Auto: ' || v_variation.bundle_name || ' - ' || v_variation.name, 
            'Auto-generated list for all users with access to ' || v_variation.name || ' variation of ' || v_variation.bundle_name, 
            'auto_variation', 
            v_variation.id
        )
        ON CONFLICT ("name") DO NOTHING
        RETURNING "id" INTO v_list_id;
        
        IF v_list_id IS NOT NULL THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    -- Sync the auto-generated variation lists with current user access
    PERFORM "access"."sync_auto_variation_lists"();

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync all auto-bundle lists with current user access
CREATE OR REPLACE FUNCTION "access"."sync_auto_bundle_lists"() RETURNS VOID AS $$
DECLARE
    v_auto_list RECORD;
    v_user_ids UUID[];
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync auto-bundle lists';
    END IF;

    -- Process each auto-bundle list
    FOR v_auto_list IN (
        SELECT "id", "bundle_id" 
        FROM "access"."access_lists" 
        WHERE "list_type" = 'auto_bundle' AND "bundle_id" IS NOT NULL
    )
    LOOP
        -- Clear current list members
        DELETE FROM "access"."list_members" WHERE "list_id" = v_auto_list.id;
        
        -- Get all users with access to this bundle
        SELECT array_agg(DISTINCT ua."user_id") INTO v_user_ids
        FROM "access"."user_access" ua
        JOIN "access"."content_templates" ct ON ua."content_id" = ct."content_id"
        JOIN "access"."bundle_templates" bt ON bt."template_id" = ct."id" AND bt."template_type" = 'content'
        JOIN "access"."bundle_variations" bv ON bt."bundle_variation_id" = bv."id"
        JOIN "access"."bundles" b ON bv."bundle_id" = b."id"
        WHERE b."id" = v_auto_list.bundle_id;

        -- If there are users with access, add them to the list
        IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
            INSERT INTO "access"."list_members" ("list_id", "user_id")
            SELECT v_auto_list.id, unnest(v_user_ids);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync all auto-variation lists with current user access
CREATE OR REPLACE FUNCTION "access"."sync_auto_variation_lists"() RETURNS VOID AS $$
DECLARE
    v_auto_list RECORD;
    v_user_ids UUID[];
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync auto-variation lists';
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
        
        -- Get all users with this specific variation
        SELECT array_agg(DISTINCT ua."user_id") INTO v_user_ids
        FROM "access"."user_access" ua
        JOIN "access"."content_templates" ct ON ua."content_id" = ct."content_id"
        JOIN "access"."bundle_templates" bt ON bt."template_id" = ct."id" AND bt."template_type" = 'content'
        WHERE bt."bundle_variation_id" = v_auto_list.variation_id;

        -- If there are users with access, add them to the list
        IF v_user_ids IS NOT NULL AND array_length(v_user_ids, 1) > 0 THEN
            INSERT INTO "access"."list_members" ("list_id", "user_id")
            SELECT v_auto_list.id, unnest(v_user_ids);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a combined list from multiple source lists
CREATE OR REPLACE FUNCTION "access"."create_combined_list"(
    p_name TEXT,
    p_description TEXT,
    p_source_lists UUID[],
    p_list_operation TEXT -- 'union', 'intersection', 'difference'
) RETURNS UUID AS $$
DECLARE
    v_list_id UUID;
    v_user_ids UUID[];
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can create combined lists';
    END IF;
    
    -- Validate operation
    IF p_list_operation NOT IN ('union', 'intersection', 'difference') THEN
        RAISE EXCEPTION 'Invalid list operation. Must be one of: union, intersection, difference';
    END IF;
    
    -- Create the combination list
    INSERT INTO "access"."access_lists" (
        "name",
        "description",
        "list_type",
        "source_lists",
        "list_operation"
    ) VALUES (
        p_name,
        p_description,
        'combination',
        p_source_lists,
        p_list_operation
    ) RETURNING "id" INTO v_list_id;
    
    -- Apply the combination operation to populate the list
    PERFORM "access"."sync_combined_list"(v_list_id);
    
    RETURN v_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync a combined list based on its operation and source lists
CREATE OR REPLACE FUNCTION "access"."sync_combined_list"(
    p_list_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_source_lists UUID[];
    v_operation TEXT;
    v_user_ids UUID[];
    v_count INTEGER;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync combined lists';
    END IF;
    
    -- Get the source lists and operation for this combination list
    SELECT "source_lists", "list_operation" 
    INTO v_source_lists, v_operation
    FROM "access"."access_lists"
    WHERE "id" = p_list_id AND "list_type" = 'combination';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Combined list with ID % not found', p_list_id;
    END IF;
    
    -- Delete existing members
    DELETE FROM "access"."list_members" WHERE "list_id" = p_list_id;
    
    -- Apply the appropriate set operation
    CASE v_operation
        WHEN 'union' THEN
            -- Union: Get all users from any source list
            WITH all_members AS (
                SELECT DISTINCT "user_id"
                FROM "access"."list_members"
                WHERE "list_id" = ANY(v_source_lists)
            )
            INSERT INTO "access"."list_members" ("list_id", "user_id")
            SELECT p_list_id, "user_id" FROM all_members;
            
        WHEN 'intersection' THEN
            -- Intersection: Get users who are in ALL source lists
            WITH list_counts AS (
                SELECT 
                    "user_id", 
                    COUNT(DISTINCT "list_id") AS list_count
                FROM "access"."list_members"
                WHERE "list_id" = ANY(v_source_lists)
                GROUP BY "user_id"
            )
            INSERT INTO "access"."list_members" ("list_id", "user_id")
            SELECT p_list_id, "user_id" 
            FROM list_counts
            WHERE list_count = array_length(v_source_lists, 1);
            
        WHEN 'difference' THEN
            -- Difference: Get users in the first list but not in any other
            IF array_length(v_source_lists, 1) >= 1 THEN
                WITH first_list_members AS (
                    SELECT "user_id"
                    FROM "access"."list_members"
                    WHERE "list_id" = v_source_lists[1]
                ),
                other_list_members AS (
                    SELECT DISTINCT "user_id"
                    FROM "access"."list_members"
                    WHERE "list_id" = ANY(v_source_lists[2:])
                )
                INSERT INTO "access"."list_members" ("list_id", "user_id")
                SELECT p_list_id, "user_id" 
                FROM first_list_members
                WHERE "user_id" NOT IN (SELECT "user_id" FROM other_list_members);
            END IF;
    END CASE;
    
    -- Count how many members were added
    SELECT COUNT(*) INTO v_count FROM "access"."list_members" WHERE "list_id" = p_list_id;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync all auto-generated lists
CREATE OR REPLACE FUNCTION "access"."sync_all_auto_lists"() RETURNS VOID AS $$
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync all auto lists';
    END IF;
    
    -- Sync bundle and variation lists
    PERFORM "access"."sync_auto_bundle_lists"();
    PERFORM "access"."sync_auto_variation_lists"();
    
    -- Sync combination lists (they might depend on auto-lists)
    PERFORM "access"."sync_all_combined_lists"();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync all combined lists
CREATE OR REPLACE FUNCTION "access"."sync_all_combined_lists"() RETURNS INTEGER AS $$
DECLARE
    v_list RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can sync all combined lists';
    END IF;
    
    -- Process each combination list
    FOR v_list IN (
        SELECT "id" 
        FROM "access"."access_lists" 
        WHERE "list_type" = 'combination'
    )
    LOOP
        -- Sync this combined list
        PERFORM "access"."sync_combined_list"(v_list.id);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lists that a user belongs to
CREATE OR REPLACE FUNCTION "access"."get_user_lists"(
    p_user_id UUID
) RETURNS TABLE (
    list_id UUID,
    name TEXT,
    description TEXT,
    list_type TEXT,
    member_count BIGINT
) AS $$
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can view user lists';
    END IF;
    
    -- Return all lists that the user belongs to
    RETURN QUERY
    SELECT 
        al."id" AS list_id,
        al."name",
        al."description",
        al."list_type",
        COUNT(lm."user_id") AS member_count
    FROM "access"."access_lists" al
    JOIN "access"."list_members" lm ON al."id" = lm."list_id"
    WHERE EXISTS (
        SELECT 1 
        FROM "access"."list_members" 
        WHERE "list_id" = al."id" AND "user_id" = p_user_id
    )
    GROUP BY al."id", al."name", al."description", al."list_type"
    ORDER BY al."name";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a trigger to sync auto-lists when user_access changes
CREATE OR REPLACE FUNCTION "access"."trigger_sync_auto_lists"() RETURNS TRIGGER AS $$
BEGIN
    -- Schedule auto-lists sync to run soon
    -- In a real implementation, you might want to use a job queue or batching
    -- For simplicity, we're just running it synchronously here
    PERFORM "access"."sync_all_auto_lists"();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create an after statement trigger on user_access
DROP TRIGGER IF EXISTS "sync_auto_lists_trigger" ON "access"."user_access";
CREATE TRIGGER "sync_auto_lists_trigger"
AFTER INSERT OR UPDATE OR DELETE
ON "access"."user_access"
FOR EACH STATEMENT
EXECUTE FUNCTION "access"."trigger_sync_auto_lists"();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "access"."generate_bundle_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."generate_variation_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_auto_bundle_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_auto_variation_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."create_combined_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_combined_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_all_auto_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."sync_all_combined_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."get_user_lists" TO authenticated; 