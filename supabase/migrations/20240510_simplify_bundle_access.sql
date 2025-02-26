-- Create a simple table to track which users have access to which bundle variations
CREATE TABLE IF NOT EXISTS access.bundle_variation_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES access.bundle_variations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (user_id, variation_id)
);

-- Add RLS policies
ALTER TABLE access.bundle_variation_access ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage the access
CREATE POLICY "Allow admins to manage bundle variation access"
    ON access.bundle_variation_access
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'super_admin'));

-- Allow users to view their own access
CREATE POLICY "Allow users to view their own access"
    ON access.bundle_variation_access
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create function to grant access to users
CREATE OR REPLACE FUNCTION access.grant_bundle_variation_access(
    p_user_ids UUID[],
    p_variation_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Only administrators can grant bundle variation access';
    END IF;

    -- Grant access to each user
    INSERT INTO access.bundle_variation_access (user_id, variation_id, created_by)
    SELECT 
        u.user_id,
        p_variation_id,
        auth.uid()
    FROM unnest(p_user_ids) AS u(user_id)
    ON CONFLICT (user_id, variation_id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke access from users
CREATE OR REPLACE FUNCTION access.revoke_bundle_variation_access(
    p_user_ids UUID[],
    p_variation_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Only administrators can revoke bundle variation access';
    END IF;

    -- Revoke access from each user
    DELETE FROM access.bundle_variation_access
    WHERE variation_id = p_variation_id
    AND user_id = ANY(p_user_ids);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get users with access to a variation
CREATE OR REPLACE FUNCTION access.get_variation_users(
    p_variation_id UUID
) RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    created_by UUID
) AS $$
BEGIN
    -- Check if current user is admin
    IF auth.jwt() ->> 'role' NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Only administrators can view variation users';
    END IF;

    RETURN QUERY
    SELECT 
        bva.user_id,
        u.email,
        bva.created_at,
        bva.created_by
    FROM access.bundle_variation_access bva
    JOIN auth.users u ON bva.user_id = u.id
    WHERE bva.variation_id = p_variation_id
    ORDER BY u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION access.grant_bundle_variation_access(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION access.revoke_bundle_variation_access(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION access.get_variation_users(UUID) TO authenticated; 