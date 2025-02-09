-- Drop existing objects to ensure clean slate
DROP SCHEMA IF EXISTS content CASCADE;

-- Create content schema
CREATE SCHEMA content;

-- Create collections table
CREATE TABLE content.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE content.collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" 
    ON content.collections 
    FOR SELECT 
    TO public 
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
    ON content.collections 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Grant schema usage
GRANT USAGE ON SCHEMA content TO public;
GRANT USAGE ON SCHEMA content TO authenticated;

-- Grant table permissions
GRANT SELECT ON content.collections TO public;
GRANT SELECT, INSERT ON content.collections TO authenticated;

-- Insert test data
INSERT INTO content.collections (name, description)
VALUES ('Test Collection', 'This is a test collection')
ON CONFLICT DO NOTHING; 