-- Auto-List Management Automation
-- Description: Implement triggers and functions for fully automatic access list generation and synchronization

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
        WHERE table_schema = 'access' AND table_name = 'bundles'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table "access.bundles" does not exist. Please run prior migrations first.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'access' AND table_name = 'bundle_variations'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table "access.bundle_variations" does not exist. Please run prior migrations first.';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'access' AND table_name = 'user_access'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table "access.user_access" does not exist. Please run prior migrations first.';
    END IF;
END $$;

-- 1. Trigger to automatically create auto-lists when new bundles are created
CREATE OR REPLACE FUNCTION "access"."trigger_bundle_auto_list"() 
RETURNS TRIGGER AS $$
BEGIN
    -- Create auto-list for the new bundle
    INSERT INTO "access"."access_lists" (
        "name", 
        "description", 
        "list_type", 
        "bundle_id"
    ) VALUES (
        'Auto: ' || NEW.name, 
        'Auto-generated list for all users with access to ' || NEW.name, 
        'auto_bundle', 
        NEW.id
    ) ON CONFLICT ("name") DO NOTHING;
    
    -- Immediately sync the list
    PERFORM "access"."sync_auto_bundle_lists"();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the bundles table
DROP TRIGGER IF EXISTS "create_bundle_auto_list" ON "access"."bundles";
CREATE TRIGGER "create_bundle_auto_list"
AFTER INSERT ON "access"."bundles"
FOR EACH ROW
EXECUTE FUNCTION "access"."trigger_bundle_auto_list"();

-- 2. Trigger to automatically create auto-lists when new variations are created
CREATE OR REPLACE FUNCTION "access"."trigger_variation_auto_list"() 
RETURNS TRIGGER AS $$
DECLARE
    v_bundle_name TEXT;
BEGIN
    -- Get the bundle name
    SELECT "name" INTO v_bundle_name 
    FROM "access"."bundles" 
    WHERE "id" = NEW.bundle_id;
    
    -- Create auto-list for the new variation
    INSERT INTO "access"."access_lists" (
        "name", 
        "description", 
        "list_type", 
        "variation_id"
    ) VALUES (
        'Auto: ' || v_bundle_name || ' - ' || NEW.variation_name, 
        'Auto-generated list for all users with access to ' || NEW.variation_name || ' variation of ' || v_bundle_name, 
        'auto_variation', 
        NEW.id
    ) ON CONFLICT ("name") DO NOTHING;
    
    -- Immediately sync the list
    PERFORM "access"."sync_auto_variation_lists"();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the bundle_variations table
DROP TRIGGER IF EXISTS "create_variation_auto_list" ON "access"."bundle_variations";
CREATE TRIGGER "create_variation_auto_list"
AFTER INSERT ON "access"."bundle_variations"
FOR EACH ROW
EXECUTE FUNCTION "access"."trigger_variation_auto_list"();

-- 3. Trigger to update auto-list names when bundle names change
CREATE OR REPLACE FUNCTION "access"."update_bundle_auto_list_names"() 
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if name changed
    IF NEW.name <> OLD.name THEN
        -- Update the auto-bundle list name
        UPDATE "access"."access_lists"
        SET "name" = 'Auto: ' || NEW.name,
            "description" = 'Auto-generated list for all users with access to ' || NEW.name
        WHERE "bundle_id" = NEW.id AND "list_type" = 'auto_bundle';
        
        -- Update names of variation lists that include this bundle
        UPDATE "access"."access_lists" al
        SET "name" = 'Auto: ' || NEW.name || ' - ' || bv.variation_name,
            "description" = 'Auto-generated list for all users with access to ' || bv.variation_name || ' variation of ' || NEW.name
        FROM "access"."bundle_variations" bv
        WHERE bv.bundle_id = NEW.id
        AND al.variation_id = bv.id
        AND al.list_type = 'auto_variation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the bundles table for name updates
DROP TRIGGER IF EXISTS "update_bundle_auto_list_names" ON "access"."bundles";
CREATE TRIGGER "update_bundle_auto_list_names"
AFTER UPDATE ON "access"."bundles"
FOR EACH ROW
EXECUTE FUNCTION "access"."update_bundle_auto_list_names"();

-- 4. Trigger to update auto-list names when variation names change
CREATE OR REPLACE FUNCTION "access"."update_variation_auto_list_names"() 
RETURNS TRIGGER AS $$
DECLARE
    v_bundle_name TEXT;
BEGIN
    -- Only proceed if variation_name changed
    IF NEW.variation_name <> OLD.variation_name THEN
        -- Get the bundle name
        SELECT "name" INTO v_bundle_name 
        FROM "access"."bundles" 
        WHERE "id" = NEW.bundle_id;
        
        -- Update the auto-variation list name
        UPDATE "access"."access_lists"
        SET "name" = 'Auto: ' || v_bundle_name || ' - ' || NEW.variation_name,
            "description" = 'Auto-generated list for all users with access to ' || NEW.variation_name || ' variation of ' || v_bundle_name
        WHERE "variation_id" = NEW.id AND "list_type" = 'auto_variation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the bundle_variations table for name updates
DROP TRIGGER IF EXISTS "update_variation_auto_list_names" ON "access"."bundle_variations";
CREATE TRIGGER "update_variation_auto_list_names"
AFTER UPDATE ON "access"."bundle_variations"
FOR EACH ROW
EXECUTE FUNCTION "access"."update_variation_auto_list_names"();

-- 5. Enhanced trigger for syncing auto-lists when user access changes
CREATE OR REPLACE FUNCTION "access"."trigger_sync_auto_lists"() RETURNS TRIGGER AS $$
BEGIN
    -- Run synchronization
    PERFORM "access"."sync_all_auto_lists"();
    
    -- Also sync combination lists since they might depend on auto-lists
    PERFORM "access"."sync_all_combined_lists"();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger is properly set up on user_access
DROP TRIGGER IF EXISTS "sync_auto_lists_trigger" ON "access"."user_access";
CREATE TRIGGER "sync_auto_lists_trigger"
AFTER INSERT OR UPDATE OR DELETE
ON "access"."user_access"
FOR EACH STATEMENT
EXECUTE FUNCTION "access"."trigger_sync_auto_lists"();

-- 6. Initial setup function to ensure all auto-lists exist for current data
CREATE OR REPLACE FUNCTION "access"."setup_all_auto_lists"() RETURNS INTEGER AS $$
DECLARE
    v_bundle_count INTEGER := 0;
    v_variation_count INTEGER := 0;
BEGIN
    -- Generate lists for all bundles
    SELECT COUNT(*) INTO v_bundle_count FROM "access"."generate_bundle_lists"();
    
    -- Generate lists for all variations
    SELECT COUNT(*) INTO v_variation_count FROM "access"."generate_variation_lists"();
    
    -- Sync all auto-lists
    PERFORM "access"."sync_all_auto_lists"();
    
    -- Sync all combination lists
    PERFORM "access"."sync_all_combined_lists"();
    
    RETURN v_bundle_count + v_variation_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to run the initial setup (can be called manually after migration)
COMMENT ON FUNCTION "access"."setup_all_auto_lists"() IS 
'Run this function to initialize all auto-generated lists for existing bundles and variations.
Example usage: SELECT access.setup_all_auto_lists();';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "access"."trigger_bundle_auto_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."trigger_variation_auto_list" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."update_bundle_auto_list_names" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."update_variation_auto_list_names" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."trigger_sync_auto_lists" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."setup_all_auto_lists" TO authenticated;

-- Run the setup function to create auto-lists for existing data
SELECT "access"."setup_all_auto_lists"(); 