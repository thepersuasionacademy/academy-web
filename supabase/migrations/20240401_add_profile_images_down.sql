-- Drop the updated function first
DROP FUNCTION IF EXISTS public.get_user_names(uuid);

-- Drop the view first
DROP VIEW IF EXISTS public.user_profiles;

-- Recreate the original get_user_names function
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
  FROM auth.users up
  WHERE up.id = p_user_id;
END;
$$;

-- Recreate the original view
CREATE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  updated_at
FROM auth.users;

-- Drop the profile image functions
DROP FUNCTION IF EXISTS public.update_user_avatar(uuid, text);
DROP FUNCTION IF EXISTS public.sync_google_avatar(uuid, text);

-- Drop storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile images" ON storage.objects;

-- Back up and remove profile image columns
DO $$ 
BEGIN
    -- Only create backup if we have data to back up
    IF EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE avatar_url IS NOT NULL 
        OR custom_avatar_path IS NOT NULL
    ) THEN
        -- Create a permanent backup table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.profile_images_backup (
            user_id uuid PRIMARY KEY,
            avatar_url text,
            custom_avatar_path text,
            backed_up_at timestamptz DEFAULT now()
        );

        -- Insert or update backup data
        INSERT INTO public.profile_images_backup (user_id, avatar_url, custom_avatar_path)
        SELECT id, avatar_url, custom_avatar_path
        FROM auth.users
        WHERE avatar_url IS NOT NULL OR custom_avatar_path IS NOT NULL
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            avatar_url = EXCLUDED.avatar_url,
            custom_avatar_path = EXCLUDED.custom_avatar_path,
            backed_up_at = now();
    END IF;

    -- Remove the columns
    ALTER TABLE auth.users 
    DROP COLUMN IF EXISTS avatar_url,
    DROP COLUMN IF EXISTS custom_avatar_path;
END $$;

-- Note: The profile-images bucket and its contents are preserved
-- You can manually remove them later using:
-- DELETE FROM storage.buckets WHERE id = 'profile-images'; 