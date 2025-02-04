CREATE OR REPLACE FUNCTION get_tool_with_names(p_tool_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  credits_cost INTEGER,
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
  FROM ai_tools t
  LEFT JOIN ai_suites s ON t.suite_id = s.id
  LEFT JOIN ai_collections c ON s.collection_id = c.id
  WHERE t.id = p_tool_id;
END;
$$; 