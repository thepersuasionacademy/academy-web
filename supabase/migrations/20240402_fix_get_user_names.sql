-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_user_names(uuid);

-- Create the function with consistent types
CREATE OR REPLACE FUNCTION public.get_user_names(p_user_id uuid)
RETURNS TABLE (
  first_name text,
  last_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.first_name, 'Add your name'::text) as first_name,
    COALESCE(up.last_name, ''::text) as last_name,
    up.email::text
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
END;
$$; 