-- Create access lists tables for bulk user access management
-- Description: Tables to manage lists of users and associate them with access bundle variations

-- Check if required tables exist
DO $$
BEGIN
    -- Check that prerequisite tables exist
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

-- Create access_lists table
CREATE TABLE IF NOT EXISTS "access"."access_lists" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variation_id" UUID REFERENCES "access"."bundle_variations"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "access_lists_name_unique" UNIQUE ("name")
);

-- Create RLS policies for access_lists
ALTER TABLE "access"."access_lists" ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view access lists
CREATE POLICY "admins_can_view_access_lists" 
ON "access"."access_lists"
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Only allow admins to insert access lists
CREATE POLICY "admins_can_insert_access_lists" 
ON "access"."access_lists"
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Only allow admins to update access lists
CREATE POLICY "admins_can_update_access_lists" 
ON "access"."access_lists"
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Only allow admins to delete access lists
CREATE POLICY "admins_can_delete_access_lists" 
ON "access"."access_lists"
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Create list_members junction table
CREATE TABLE IF NOT EXISTS "access"."list_members" (
    "list_id" UUID REFERENCES "access"."access_lists"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("list_id", "user_id")
);

-- Create RLS policies for list_members
ALTER TABLE "access"."list_members" ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view list members
CREATE POLICY "admins_can_view_list_members" 
ON "access"."list_members"
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Only allow admins to insert list members
CREATE POLICY "admins_can_insert_list_members" 
ON "access"."list_members"
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Only allow admins to delete list members
CREATE POLICY "admins_can_delete_list_members" 
ON "access"."list_members"
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "access"."update_updated_at_column"() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at when access_lists is updated
CREATE TRIGGER "update_access_lists_updated_at"
BEFORE UPDATE ON "access"."access_lists"
FOR EACH ROW
EXECUTE FUNCTION "access"."update_updated_at_column"();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA "access" TO authenticated;
GRANT ALL ON "access"."access_lists" TO authenticated;
GRANT ALL ON "access"."list_members" TO authenticated; 