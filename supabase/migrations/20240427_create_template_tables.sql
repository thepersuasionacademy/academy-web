-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS access;

-- Enable RLS
ALTER TABLE IF EXISTS access.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS access.ai_templates ENABLE ROW LEVEL SECURITY;

-- Create content templates table
CREATE TABLE access.content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content_id UUID NOT NULL,
    access_overrides JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- Create AI templates table
CREATE TABLE access.ai_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    access_level TEXT NOT NULL CHECK (access_level IN ('collection', 'suite', 'tool')),
    target_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name)
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION access.set_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_content_templates_updated_at
    BEFORE UPDATE ON access.content_templates
    FOR EACH ROW
    EXECUTE FUNCTION access.set_template_updated_at();

CREATE TRIGGER set_ai_templates_updated_at
    BEFORE UPDATE ON access.ai_templates
    FOR EACH ROW
    EXECUTE FUNCTION access.set_template_updated_at();

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON access.content_templates
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users" ON access.ai_templates
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Enable insert for admins" ON access.content_templates
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable insert for admins" ON access.ai_templates
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable update for admins" ON access.content_templates
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable update for admins" ON access.ai_templates
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Grant necessary permissions
GRANT ALL ON access.content_templates TO authenticated;
GRANT ALL ON access.ai_templates TO authenticated; 