-- Drop and recreate the update_user_avatar function with proper security checks
CREATE OR REPLACE FUNCTION public.update_user_avatar(
  user_id uuid,
  new_avatar_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add security check to ensure users can only update their own avatar
  IF auth.uid() = user_id THEN
    UPDATE auth.users
    SET 
      custom_avatar_path = new_avatar_path,
      avatar_url = NULL, -- Clear Google avatar when custom is set
      updated_at = now()
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Not authorized to update this user''s avatar';
  END IF;
END;
$$;

-- Ensure the function can be executed by authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_avatar(uuid, text) TO authenticated;

-- Add RLS policy to auth.users for avatar updates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'auth' 
    AND policyname = 'Users can update their own avatar'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON auth.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END
$$; 