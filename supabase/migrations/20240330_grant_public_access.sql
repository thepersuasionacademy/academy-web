-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA credits TO anon, authenticated;

-- Grant access to the table for anon and authenticated roles
GRANT ALL ON credits.tool_runs TO anon, authenticated; 