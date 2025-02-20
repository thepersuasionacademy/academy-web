-- Create a simple function to test user access records
CREATE OR REPLACE FUNCTION public.test_get_user_access(
    p_content_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    content_id UUID,
    granted_at TIMESTAMPTZ,
    access_starts_at TIMESTAMPTZ,
    access_overrides JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, access
STABLE
AS $$
    SELECT 
        id,
        user_id,
        content_id,
        granted_at,
        access_starts_at,
        access_overrides
    FROM access.user_access
    WHERE user_id = p_user_id 
    AND content_id = p_content_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.test_get_user_access(UUID, UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.test_get_user_access(UUID, UUID) IS 'Simple test function to verify user access records exist for specific content'; 