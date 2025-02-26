-- Function to get all access lists associated with a specific variation
CREATE OR REPLACE FUNCTION get_lists_by_variation(p_variation_id TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  list_type TEXT,
  bundle_id UUID,
  variation_id UUID,
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

  -- Return all access lists associated with the variation
  RETURN QUERY
  SELECT 
    al.id,
    al.name,
    al.description,
    al.list_type,
    al.bundle_id,
    al.variation_id,
    al.created_at,
    al.updated_at
  FROM 
    access.access_lists al
  WHERE 
    al.variation_id = p_variation_id::UUID
  ORDER BY 
    al.name;
END;
$$; 