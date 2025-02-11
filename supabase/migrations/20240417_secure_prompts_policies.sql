-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access for prompts" ON ai.prompts;
DROP POLICY IF EXISTS "Super admins can manage prompts" ON ai.prompts;

-- Ensure RLS is enabled
ALTER TABLE ai.prompts ENABLE ROW LEVEL SECURITY;

-- Create new restrictive policies
-- Only allow super admins to manage prompts (CRUD operations)
CREATE POLICY "Super admins can manage prompts"
    ON ai.prompts
    FOR ALL
    TO authenticated
    USING (public.is_super_admin());

-- Only allow service role to read prompts
-- This ensures prompts can only be accessed through our secure API endpoints
CREATE POLICY "Service role can read prompts"
    ON ai.prompts
    FOR SELECT
    TO service_role
    USING (true);

-- Revoke direct table access from authenticated users
REVOKE SELECT, INSERT, UPDATE, DELETE ON ai.prompts FROM authenticated;

-- Grant access only to service role and super admins
GRANT SELECT ON ai.prompts TO service_role;
GRANT ALL ON ai.prompts TO authenticated; 