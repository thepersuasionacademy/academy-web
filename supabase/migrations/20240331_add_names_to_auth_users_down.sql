-- Drop the public function
DROP FUNCTION IF EXISTS public.get_user_names(uuid);

-- Drop the view
DROP VIEW IF EXISTS public.user_profiles;

-- Drop the auth function
DROP FUNCTION IF EXISTS auth.update_user_names(uuid, text, text);

-- Remove the columns from auth.users
ALTER TABLE auth.users 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name; 