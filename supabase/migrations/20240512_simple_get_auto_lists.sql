-- Simple function to get auto-generated list names
CREATE OR REPLACE FUNCTION public.get_auto_list_names()
RETURNS TABLE (
  id UUID,
  name TEXT,
  list_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.name,
    al.list_type
  FROM 
    access.access_lists al
  WHERE 
    al.list_type IN ('auto_bundle', 'auto_variation')
  ORDER BY 
    al.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_auto_list_names() TO authenticated; 