-- Drop the existing function first
DROP FUNCTION IF EXISTS public.update_user_avatar(uuid, text);

-- Recreate the function with a different approach
CREATE OR REPLACE FUNCTION public.update_user_avatar(
  user_id uuid,
  new_avatar_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_id uuid;
BEGIN
  -- Get the ID of the requesting user
  requesting_user_id := auth.uid();
  
  -- Verify the requesting user matches the target user_id
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF requesting_user_id != user_id THEN
    RAISE EXCEPTION 'Not authorized to update this user''s avatar';
  END IF;

  -- Perform the update using raw SQL to bypass RLS
  EXECUTE 'UPDATE auth.users SET custom_avatar_path = $1, avatar_url = NULL, updated_at = now() WHERE id = $2'
  USING new_avatar_path, user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_avatar(uuid, text) TO authenticated; 