-- Create content schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS content;

-- Drop existing table if it exists
DROP TABLE IF EXISTS content.collections CASCADE;

-- Create collections table in content schema
CREATE TABLE content.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE content.collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON content.collections;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON content.collections;

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

-- Grant schema usage to public and authenticated roles
GRANT USAGE ON SCHEMA content TO public;
GRANT USAGE ON SCHEMA content TO authenticated;

-- Grant table permissions
GRANT SELECT ON content.collections TO public;
GRANT SELECT, INSERT ON content.collections TO authenticated; 