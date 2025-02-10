-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_tool_prompts(uuid);

-- Create function to get tool prompts
CREATE OR REPLACE FUNCTION public.get_tool_prompts(tool_id uuid)
RETURNS SETOF ai.prompts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM ai.prompts 
  WHERE tool_id = $1 
  ORDER BY prompt_order ASC;
$$;

-- Grant access to public
GRANT EXECUTE ON FUNCTION public.get_tool_prompts(uuid) TO public; 