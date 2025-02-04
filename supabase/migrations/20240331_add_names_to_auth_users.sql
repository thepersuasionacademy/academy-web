-- Add name columns to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Create function to update user names in auth schema
CREATE OR REPLACE FUNCTION auth.update_user_names(
  user_id uuid,
  new_first_name text,
  new_last_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET 
    first_name = new_first_name,
    last_name = new_last_name,
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Create public wrapper for update_user_names
CREATE OR REPLACE FUNCTION public.update_user_names(
  user_id uuid,
  new_first_name text,
  new_last_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM auth.update_user_names(user_id, new_first_name, new_last_name);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.update_user_names(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_names(uuid, text, text) TO authenticated;

-- Create function to get user names
CREATE OR REPLACE FUNCTION auth.get_user_names(p_user_id uuid)
RETURNS TABLE (
  first_name text,
  last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.first_name, u.last_name
  FROM auth.users u
  WHERE u.id = p_user_id;
END;
$$;

-- Create a secure view for accessing user data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  updated_at
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;

-- Drop existing function before recreating with new return type
DROP FUNCTION IF EXISTS public.get_user_names(uuid);

-- Create the new function with updated return type
CREATE OR REPLACE FUNCTION public.get_user_names(p_user_id uuid)
RETURNS TABLE (
  first_name text,
  last_name text,
  email varchar(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.first_name, 'Add your name') as first_name,
    COALESCE(up.last_name, '') as last_name,
    up.email
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
END;
$$;

-- Drop the auth schema function as we'll use the public one
DROP FUNCTION IF EXISTS auth.get_user_names(uuid); 