-- Save the bundle_structure view definition before dropping it
DO $$
DECLARE
    view_definition TEXT;
BEGIN
    -- Get the view definition
    SELECT pg_get_viewdef('access.bundle_structure'::regclass, true) INTO view_definition;
    
    -- Store the view definition for recreation later
    CREATE TEMP TABLE IF NOT EXISTS temp_view_definitions(
        view_name TEXT PRIMARY KEY,
        view_def TEXT
    );
    
    -- Insert or update the view definition
    INSERT INTO temp_view_definitions(view_name, view_def)
    VALUES ('access.bundle_structure', view_definition)
    ON CONFLICT (view_name) DO UPDATE SET view_def = view_definition;
EXCEPTION WHEN undefined_table THEN
    -- If view doesn't exist, just continue
    NULL;
END
$$;

-- Drop dependent views first
DROP VIEW IF EXISTS access.bundle_structure CASCADE;

-- Drop old table constraints before modifying
ALTER TABLE access.ai_templates DROP CONSTRAINT IF EXISTS ai_templates_pkey;

-- Drop foreign key constraints if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ai_templates_created_by_fkey' 
    AND table_schema = 'access' AND table_name = 'ai_templates'
  ) THEN
    ALTER TABLE access.ai_templates DROP CONSTRAINT ai_templates_created_by_fkey;
  END IF;
END
$$;

-- Backup existing data if needed
CREATE TABLE IF NOT EXISTS access.ai_templates_backup AS 
SELECT * FROM access.ai_templates;

-- Drop and recreate the AI templates table with new structure
DROP TABLE IF EXISTS access.ai_templates;

-- Create the new table with updated structure
CREATE TABLE access.ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_variation_id UUID NOT NULL REFERENCES access.bundle_variations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add appropriate indexes
CREATE INDEX idx_ai_templates_bundle_variation ON access.ai_templates(bundle_variation_id);
CREATE INDEX idx_ai_templates_target_id ON access.ai_templates(target_id);
CREATE INDEX idx_ai_templates_created_by ON access.ai_templates(created_by);

-- Add RLS policies
ALTER TABLE access.ai_templates ENABLE ROW LEVEL SECURITY;

-- Policy for administrators to manage templates
CREATE POLICY admin_manage_ai_templates ON access.ai_templates
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users WHERE auth.uid() = access.ai_templates.created_by
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'is_admin' = 'true'
    )
  );

-- Policy for viewing templates
CREATE POLICY view_ai_templates ON access.ai_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION access.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_templates_timestamp
BEFORE UPDATE ON access.ai_templates
FOR EACH ROW
EXECUTE FUNCTION access.update_timestamp();

-- Add comment on table
COMMENT ON TABLE access.ai_templates IS 'AI templates for access control, linking bundle variations to AI tools, suites, or categories';

-- Recreate the bundle_structure view with a simplified version
CREATE OR REPLACE VIEW access.bundle_structure AS
SELECT
  b.id AS bundle_id,
  b.name AS bundle_name,
  b.description AS bundle_description,
  bv.id AS variation_id,
  bv.variation_name AS variation_name,
  NULL::jsonb AS content_templates,
  NULL::jsonb AS ai_templates
FROM access.bundles b
JOIN access.bundle_variations bv ON bv.bundle_id = b.id
ORDER BY b.name, bv.variation_name; 