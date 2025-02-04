-- Grant usage on the credits schema
GRANT USAGE ON SCHEMA credits TO authenticated;

-- Grant permissions on the tool_runs table in credits schema
GRANT INSERT, SELECT ON credits.tool_runs TO authenticated;

-- Enable RLS if not already enabled
ALTER TABLE credits.tool_runs ENABLE ROW LEVEL SECURITY;

-- Create or replace policies for authenticated users
CREATE POLICY "Allow authenticated users to insert tool runs"
ON credits.tool_runs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to view their own tool runs"
ON credits.tool_runs
FOR SELECT
TO authenticated
USING (true); 