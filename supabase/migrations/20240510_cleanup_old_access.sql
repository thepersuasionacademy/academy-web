-- Drop old triggers first (to remove dependencies)
DROP TRIGGER IF EXISTS sync_auto_lists_trigger ON access.user_access;
DROP TRIGGER IF EXISTS create_bundle_auto_list ON access.bundles;
DROP TRIGGER IF EXISTS create_variation_auto_list ON access.bundle_variations;
DROP TRIGGER IF EXISTS update_bundle_auto_list_names ON access.bundles;
DROP TRIGGER IF EXISTS update_variation_auto_list_names ON access.bundle_variations;

-- Now drop functions (after their dependent triggers are gone)
DROP FUNCTION IF EXISTS access.sync_auto_bundle_lists();
DROP FUNCTION IF EXISTS access.sync_auto_variation_lists();
DROP FUNCTION IF EXISTS access.generate_bundle_lists();
DROP FUNCTION IF EXISTS access.generate_variation_lists();
DROP FUNCTION IF EXISTS access.sync_all_auto_lists();
DROP FUNCTION IF EXISTS access.sync_all_combined_lists();
DROP FUNCTION IF EXISTS access.sync_combined_list(UUID);
DROP FUNCTION IF EXISTS access.create_combined_list(TEXT, TEXT, UUID[]);
DROP FUNCTION IF EXISTS access.get_user_lists(UUID);
DROP FUNCTION IF EXISTS access.trigger_sync_auto_lists();
DROP FUNCTION IF EXISTS access.trigger_bundle_auto_list();
DROP FUNCTION IF EXISTS access.trigger_variation_auto_list();
DROP FUNCTION IF EXISTS access.update_bundle_auto_list_names();
DROP FUNCTION IF EXISTS access.update_variation_auto_list_names();

-- Drop functions that depend on access_lists table
DROP FUNCTION IF EXISTS access.get_access_lists_by_type(text[]);
DROP FUNCTION IF EXISTS access.get_access_lists(uuid);

-- Drop old tables (if they exist)
DROP TABLE IF EXISTS access.list_members;
DROP TABLE IF EXISTS access.access_lists; 