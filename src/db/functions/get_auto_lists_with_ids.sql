-- Function to get all auto-generated lists with their bundle and variation IDs
CREATE OR REPLACE FUNCTION get_auto_lists_with_ids()
RETURNS TABLE (
  id UUID,
  name TEXT,
  list_type TEXT,
  bundle_id UUID,
  variation_id UUID
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

  -- Return all auto-generated lists with their bundle and variation IDs
  RETURN QUERY
  SELECT 
    al.id,
    al.name,
    al.list_type,
    al.bundle_id,
    al.variation_id
  FROM 
    access.access_lists al
  WHERE 
    al.list_type IN ('auto_bundle', 'auto_variation')
  ORDER BY 
    al.name;
END;
$$; 