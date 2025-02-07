-- Create AI schema
CREATE SCHEMA IF NOT EXISTS ai;

-- Create collections table
CREATE TABLE IF NOT EXISTS ai.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create suites table
CREATE TABLE IF NOT EXISTS ai.suites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES ai.collections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tools table
CREATE TABLE IF NOT EXISTS ai.tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suite_id UUID REFERENCES ai.suites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    credits_cost INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE ai.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.tools ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Allow public read access for collections" 
    ON ai.collections FOR SELECT 
    TO authenticated
    USING (true);

-- Create policies for suites
CREATE POLICY "Allow public read access for suites" 
    ON ai.suites FOR SELECT 
    TO authenticated
    USING (true);

-- Create policies for tools
CREATE POLICY "Allow public read access for tools" 
    ON ai.tools FOR SELECT 
    TO authenticated
    USING (true);

-- Grant usage on schema
GRANT USAGE ON SCHEMA ai TO authenticated;

-- Grant access to tables
GRANT SELECT ON ai.collections TO authenticated;
GRANT SELECT ON ai.suites TO authenticated;
GRANT SELECT ON ai.tools TO authenticated; 