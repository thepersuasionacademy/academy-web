-- Create bundles table
CREATE TABLE access.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- Create bundle variations table
CREATE TABLE access.bundle_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES access.bundles(id) ON DELETE CASCADE,
    variation_name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bundle_id, variation_name)
);

-- Create bundle templates table
CREATE TABLE access.bundle_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_variation_id UUID REFERENCES access.bundle_variations(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL CHECK (template_type IN ('content', 'ai')),
    template_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template validation trigger function
CREATE OR REPLACE FUNCTION access.validate_bundle_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_type = 'content' THEN
        IF NOT EXISTS (SELECT 1 FROM access.content_templates WHERE id = NEW.template_id) THEN
            RAISE EXCEPTION 'Content template with ID % does not exist', NEW.template_id;
        END IF;
    ELSIF NEW.template_type = 'ai' THEN
        IF NOT EXISTS (SELECT 1 FROM access.ai_templates WHERE id = NEW.template_id) THEN
            RAISE EXCEPTION 'AI template with ID % does not exist', NEW.template_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create template validation trigger
CREATE TRIGGER validate_bundle_template
    BEFORE INSERT OR UPDATE ON access.bundle_templates
    FOR EACH ROW
    EXECUTE FUNCTION access.validate_bundle_template();

-- Create updated_at triggers
CREATE TRIGGER set_bundles_updated_at
    BEFORE UPDATE ON access.bundles
    FOR EACH ROW
    EXECUTE FUNCTION access.set_template_updated_at();

CREATE TRIGGER set_bundle_variations_updated_at
    BEFORE UPDATE ON access.bundle_variations
    FOR EACH ROW
    EXECUTE FUNCTION access.set_template_updated_at();

CREATE TRIGGER set_bundle_templates_updated_at
    BEFORE UPDATE ON access.bundle_templates
    FOR EACH ROW
    EXECUTE FUNCTION access.set_template_updated_at();

-- Enable RLS
ALTER TABLE access.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access.bundle_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE access.bundle_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON access.bundles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON access.bundle_variations
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON access.bundle_templates
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for admins" ON access.bundles
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable insert for admins" ON access.bundle_variations
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable insert for admins" ON access.bundle_templates
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable update for admins" ON access.bundles
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable update for admins" ON access.bundle_variations
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable update for admins" ON access.bundle_templates
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Grant necessary permissions
GRANT ALL ON access.bundles TO authenticated;
GRANT ALL ON access.bundle_variations TO authenticated;
GRANT ALL ON access.bundle_templates TO authenticated;

-- Create helper view for bundle structure
CREATE OR REPLACE VIEW access.bundle_structure AS
WITH RECURSIVE bundle_tree AS (
    SELECT 
        b.id as bundle_id,
        b.name as bundle_name,
        bv.id as variation_id,
        bv.variation_name,
        bt.template_type,
        bt.template_id,
        CASE 
            WHEN bt.template_type = 'content' THEN ct.name
            WHEN bt.template_type = 'ai' THEN at.name
        END as template_name,
        CASE 
            WHEN bt.template_type = 'content' THEN ct.access_overrides
            WHEN bt.template_type = 'ai' THEN jsonb_build_object(
                'access_level', at.access_level,
                'target_id', at.target_id
            )
        END as template_details
    FROM access.bundles b
    LEFT JOIN access.bundle_variations bv ON b.id = bv.bundle_id
    LEFT JOIN access.bundle_templates bt ON bv.id = bt.bundle_variation_id
    LEFT JOIN access.content_templates ct ON bt.template_type = 'content' AND bt.template_id = ct.id
    LEFT JOIN access.ai_templates at ON bt.template_type = 'ai' AND bt.template_id = at.id
)
SELECT 
    bundle_id,
    bundle_name,
    variation_id,
    variation_name,
    jsonb_agg(
        jsonb_build_object(
            'type', template_type,
            'id', template_id,
            'name', template_name,
            'details', template_details
        )
    ) as templates
FROM bundle_tree
WHERE variation_id IS NOT NULL
GROUP BY bundle_id, bundle_name, variation_id, variation_name; 