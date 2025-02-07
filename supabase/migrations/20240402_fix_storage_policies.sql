-- Enable RLS on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile images" ON storage.objects;

-- Create simplified policies with less restrictive conditions
CREATE POLICY "Allow authenticated users to upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
);

CREATE POLICY "Allow authenticated users to update profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

CREATE POLICY "Allow authenticated users to delete profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

CREATE POLICY "Allow public to read profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Ensure the bucket exists and is configured correctly
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
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];
END
$$; 