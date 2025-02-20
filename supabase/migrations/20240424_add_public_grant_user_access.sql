-- Create a public wrapper for access.grant_user_access
CREATE OR REPLACE FUNCTION public.grant_user_access(
    p_user_id UUID,
    p_content_id UUID,
    p_granted_by UUID,
    p_access_status text DEFAULT 'granted',
    p_access_overrides jsonb DEFAULT '{}'::jsonb,
    p_access_starts_at timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN access.grant_user_access(
        p_user_id,
        p_content_id,
        p_granted_by,
        p_access_status,
        p_access_overrides,
        p_access_starts_at
    );
END;
$$;

-- Grant execute permissions on the public function
GRANT EXECUTE ON FUNCTION public.grant_user_access TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.grant_user_access IS 'Public wrapper for access.grant_user_access to manage content access permissions'; 