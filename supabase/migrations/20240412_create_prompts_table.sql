-- Create prompts table
CREATE TABLE IF NOT EXISTS ai.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID REFERENCES ai.tools(id) ON DELETE CASCADE,
    input_order INTEGER NOT NULL,
    input_name TEXT,
    input_description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE ai.prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access for prompts" 
    ON ai.prompts FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Super admins can manage prompts"
    ON ai.prompts FOR ALL
    TO authenticated
    USING (public.is_super_admin());

-- Update the get_tool_prompts function to use input_order instead of prompt_order
CREATE OR REPLACE FUNCTION public.get_tool_prompts(tool_id uuid)
RETURNS SETOF ai.prompts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM ai.prompts 
  WHERE tool_id = $1 
  ORDER BY input_order ASC;
$$;

-- Grant access to table
GRANT SELECT, INSERT, UPDATE, DELETE ON ai.prompts TO authenticated; 