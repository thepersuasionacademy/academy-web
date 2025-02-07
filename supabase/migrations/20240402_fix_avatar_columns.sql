-- Add avatar columns to auth.users if they don't exist
DO $$ 
BEGIN
    -- Add custom_avatar_path column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'custom_avatar_path'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN custom_avatar_path text;
    END IF;

    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN avatar_url text;
    END IF;
END $$;

-- Update the update_user_avatar function to handle null values gracefully
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