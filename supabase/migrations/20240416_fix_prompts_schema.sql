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
    input_order as prompt_order,
    input_description as prompt_text,
    created_at,
    updated_at
  FROM ai.prompts 
  WHERE tool_id = $1 
  ORDER BY input_order ASC;
$$;

-- Grant access to public
GRANT EXECUTE ON FUNCTION public.get_tool_prompts(uuid) TO public;

-- Update save_tool_changes function to use correct column names
DROP FUNCTION IF EXISTS public.save_tool_changes(UUID, TEXT, TEXT, INTEGER, TEXT, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.save_tool_changes(
  p_tool_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_credits_cost INTEGER,
  p_status TEXT,
  p_inputs JSONB,
  p_prompts JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ai, auth
AS $$
BEGIN
  -- Check if user is super admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can update tools';
  END IF;

  -- Update tool
  UPDATE ai.tools
  SET
    title = p_title,
    description = p_description,
    credits_cost = p_credits_cost,
    status = p_status::ai.tool_status,
    updated_at = NOW()
  WHERE id = p_tool_id;

  -- Delete existing inputs and prompts
  DELETE FROM ai.inputs WHERE tool_id = p_tool_id;
  DELETE FROM ai.prompts WHERE tool_id = p_tool_id;

  -- Insert new inputs
  INSERT INTO ai.inputs (
    id,
    tool_id,
    input_order,
    input_name,
    input_description,
    is_required,
    created_at,
    updated_at
  )
  SELECT
    (value->>'id')::UUID,
    p_tool_id,
    (value->>'input_order')::INTEGER,
    value->>'input_name',
    value->>'input_description',
    (value->>'is_required')::BOOLEAN,
    NOW(),
    NOW()
  FROM jsonb_array_elements(p_inputs) AS value;

  -- Insert new prompts with correct column names
  INSERT INTO ai.prompts (
    id,
    tool_id,
    input_order,
    input_name,
    input_description,
    is_required,
    created_at,
    updated_at
  )
  SELECT
    (value->>'id')::UUID,
    p_tool_id,
    (value->>'input_order')::INTEGER,
    value->>'input_name',
    value->>'input_description',
    (value->>'is_required')::BOOLEAN,
    NOW(),
    NOW()
  FROM jsonb_array_elements(p_prompts) AS value;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.save_tool_changes(UUID, TEXT, TEXT, INTEGER, TEXT, JSONB, JSONB) TO authenticated; 