-- Create the tool_runs table
CREATE TABLE IF NOT EXISTS tool_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name TEXT,
    suite_name TEXT,
    tool_name TEXT,
    run_timestamp TIMESTAMPTZ DEFAULT now(),
    credits_before INTEGER,
    credits_cost INTEGER,
    credits_after INTEGER,
    ai_response TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up row level security
ALTER TABLE tool_runs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own tool runs
CREATE POLICY "Allow authenticated users to insert tool runs"
ON tool_runs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow users to view their own tool runs
CREATE POLICY "Allow users to view their own tool runs"
ON tool_runs
FOR SELECT
TO authenticated
USING (true);

-- Grant necessary permissions to authenticated users
GRANT INSERT, SELECT ON tool_runs TO authenticated; 