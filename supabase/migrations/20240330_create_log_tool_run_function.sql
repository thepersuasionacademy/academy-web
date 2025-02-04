-- Drop existing function first
DROP FUNCTION IF EXISTS public.log_tool_run(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT);

-- Create function to log tool runs through public schema
CREATE OR REPLACE FUNCTION public.log_tool_run(
  user_id UUID,
  collection_name TEXT,
  suite_name TEXT,
  tool_name TEXT,
  credits_before INTEGER,
  credits_cost INTEGER,
  credits_after INTEGER,
  ai_response TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO credits.tool_runs (
    user_id,
    collection_name,
    suite_name,
    tool_name,
    credits_before,
    credits_cost,
    credits_after,
    ai_response
  ) VALUES (
    user_id,
    collection_name,
    suite_name,
    tool_name,
    credits_before,
    credits_cost,
    credits_after,
    ai_response
  )
  RETURNING to_json(tool_runs.*) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT execute on function public.log_tool_run(uuid, text, text, text, integer, integer, integer, text) to authenticated; 