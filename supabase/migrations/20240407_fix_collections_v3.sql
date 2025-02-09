-- Drop existing table if it exists
DROP TABLE IF EXISTS public.collections CASCADE;

-- Create collections table in public schema
CREATE TABLE public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" 
    ON public.collections 
    FOR SELECT 
    TO public 
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
    ON public.collections 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Grant table permissions
GRANT SELECT ON public.collections TO public;
GRANT SELECT, INSERT ON public.collections TO authenticated;

-- Insert test data
INSERT INTO public.collections (name, description)
VALUES ('Test Collection', 'This is a test collection')
ON CONFLICT DO NOTHING; 