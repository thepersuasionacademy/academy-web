-- Drop the existing function first
DROP FUNCTION IF EXISTS get_list_members(UUID);

-- Function to get all members of a specific access list
CREATE OR REPLACE FUNCTION get_list_members(p_list_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT (SELECT is_admin() OR is_super_admin()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  -- Return all members of the specified access list
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT,  -- Explicitly cast to TEXT to match return type
    ''::TEXT as first_name,  -- Placeholder for now
    ''::TEXT as last_name,   -- Placeholder for now
    u.created_at,
    u.updated_at
  FROM 
    auth.users u  -- Using auth.users instead of public.users
  JOIN 
    access.list_members lm ON u.id = lm.user_id
  WHERE 
    lm.list_id = p_list_id
  ORDER BY 
    u.email;
END;
$$; 