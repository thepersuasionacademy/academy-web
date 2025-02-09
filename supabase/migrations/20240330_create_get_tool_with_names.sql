-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_tool_with_names(UUID);

CREATE OR REPLACE FUNCTION get_tool_with_names(p_tool_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  credits_cost NUMERIC,
  collection_title TEXT,
  suite_title TEXT
)
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.credits_cost,
    c.title as collection_title,
    s.title as suite_title
  FROM ai.tools t
  LEFT JOIN ai.suites s ON t.suite_id = s.id
  LEFT JOIN ai.collections c ON s.collection_id = c.id
  WHERE t.id = p_tool_id;
END;
$$; 