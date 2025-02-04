-- Drop the old table if it exists
DROP TABLE IF EXISTS credits.tool_runs;

-- Create the new tool_runs table with exact matching structure
CREATE TABLE credits.tool_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    collection_name TEXT,
    suite_name TEXT,
    tool_name TEXT,
    credits_before INTEGER NOT NULL DEFAULT 0,
    credits_cost INTEGER NOT NULL DEFAULT 0,
    credits_after INTEGER NOT NULL DEFAULT 0,
    ai_response TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE credits.tool_runs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own runs
CREATE POLICY "Users can insert their own tool runs"
ON credits.tool_runs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own runs
CREATE POLICY "Users can view their own tool runs"
ON credits.tool_runs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON credits.tool_runs TO authenticated; 