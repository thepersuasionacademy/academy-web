-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_user_names(uuid);

-- Safely add profile image columns to auth.users if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url') 
    THEN
        ALTER TABLE auth.users ADD COLUMN avatar_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'custom_avatar_path') 
    THEN
        ALTER TABLE auth.users ADD COLUMN custom_avatar_path text;
    END IF;
END $$;

-- Create or replace function to update user's profile image
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
  UPDATE auth.users
  SET 
    custom_avatar_path = new_avatar_path,
    avatar_url = NULL, -- Clear Google avatar when custom is set
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Create or replace function to sync Google avatar
CREATE OR REPLACE FUNCTION public.sync_google_avatar(
  user_id uuid,
  google_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if there's no custom avatar
  UPDATE auth.users
  SET 
    avatar_url = google_avatar_url,
    updated_at = now()
  WHERE id = user_id
  AND custom_avatar_path IS NULL;
END;
$$;

-- Safely recreate the user_profiles view
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  updated_at,
  COALESCE(custom_avatar_path, avatar_url) as profile_image_url
FROM auth.users;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_user_avatar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_google_avatar(uuid, text) TO authenticated;

-- Safely create storage bucket for profile images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'profile-images',
    'profile-images',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];
END
$$;

-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile images" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload their own profile image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access to profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Create the new function with updated return type
CREATE OR REPLACE FUNCTION public.get_user_names(p_user_id uuid)
RETURNS TABLE (
  first_name text,
  last_name text,
  email varchar(255),
  profile_image_url text
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
    up.email,
    up.profile_image_url
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
END;
$$; 