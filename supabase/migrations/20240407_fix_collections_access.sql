-- Drop existing table if it exists
DROP TABLE IF EXISTS content.collections CASCADE;

-- Create the collections table
CREATE TABLE content.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE content.collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON content.collections;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON content.collections;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" 
    ON content.collections 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
    ON content.collections 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA content TO authenticated;
GRANT ALL ON content.collections TO authenticated;

-- Insert test data
INSERT INTO content.collections (name, description)
VALUES ('Test Collection', 'This is a test collection')
ON CONFLICT DO NOTHING; 