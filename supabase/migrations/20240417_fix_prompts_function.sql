-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_tool_prompts(uuid);

-- Create function to get tool prompts with original column names
CREATE OR REPLACE FUNCTION public.get_tool_prompts(tool_id uuid)
RETURNS SETOF ai.prompts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    tool_id,
    prompt_order,
    prompt_text,
    created_at,
    updated_at
  FROM ai.prompts 
  WHERE tool_id = $1 
  ORDER BY prompt_order ASC;
$$;

-- Grant access to public
GRANT EXECUTE ON FUNCTION public.get_tool_prompts(uuid) TO public; 