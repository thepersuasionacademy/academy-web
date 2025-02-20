-- First drop dependent views
DROP VIEW IF EXISTS access.user_content_access;

-- Then remove the access_status column and its constraint
ALTER TABLE access.user_access DROP CONSTRAINT IF EXISTS check_access_status;
ALTER TABLE access.user_access DROP COLUMN IF EXISTS access_status;

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS access.grant_user_access CASCADE;
DROP FUNCTION IF EXISTS public.grant_user_access CASCADE;

-- Create or replace the access schema function
CREATE OR REPLACE FUNCTION access.grant_user_access(
    p_user_id UUID,
    p_content_id UUID,
    p_granted_by UUID,
    p_access_overrides jsonb DEFAULT '{}'::jsonb,
    p_access_starts_at timestamptz DEFAULT CURRENT_TIMESTAMP
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debug_info jsonb;
BEGIN
    -- Insert or update access record
    INSERT INTO access.user_access (
        user_id,
        content_id,
        granted_by,
        granted_at,
        access_overrides,
        access_starts_at
    )
    VALUES (
        p_user_id,
        p_content_id,
        p_granted_by,
        CURRENT_TIMESTAMP,
        p_access_overrides,
        p_access_starts_at
    )
    ON CONFLICT (user_id, content_id) 
    DO UPDATE SET
        granted_by = EXCLUDED.granted_by,
        granted_at = EXCLUDED.granted_at,
        access_overrides = EXCLUDED.access_overrides,
        access_starts_at = EXCLUDED.access_starts_at
    RETURNING jsonb_build_object(
        'operation', CASE WHEN xmax = 0 THEN 'insert' ELSE 'update' END,
        'user_id', user_id,
        'content_id', content_id,
        'access_overrides', access_overrides,
        'access_starts_at', access_starts_at
    ) INTO v_debug_info;

    -- Record the change in history
    INSERT INTO access.access_history (
        user_access_id,
        changed_by,
        previous_settings,
        new_settings
    )
    SELECT 
        ua.id,
        p_granted_by,
        jsonb_build_object(
            'access_overrides', ua.access_overrides,
            'access_starts_at', ua.access_starts_at
        ),
        jsonb_build_object(
            'access_overrides', p_access_overrides,
            'access_starts_at', p_access_starts_at
        )
    FROM access.user_access ua
    WHERE ua.user_id = p_user_id AND ua.content_id = p_content_id;

    RETURN v_debug_info;
END;
$$;

-- Create or replace the public wrapper function
CREATE OR REPLACE FUNCTION public.grant_user_access(
    p_user_id UUID,
    p_content_id UUID,
    p_granted_by UUID,
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
        p_access_overrides,
        p_access_starts_at
    );
END;
$$;

-- Update the revoke function to simply delete the record
CREATE OR REPLACE FUNCTION access.revoke_user_access(
    p_user_id UUID,
    p_content_id UUID,
    p_revoked_by UUID,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debug_info jsonb;
    v_access_record access.user_access;
BEGIN
    -- Get the current access record before deleting
    SELECT * INTO v_access_record
    FROM access.user_access
    WHERE user_id = p_user_id AND content_id = p_content_id;

    IF v_access_record IS NULL THEN
        RETURN jsonb_build_object(
            'operation', 'none',
            'message', 'No access record found to revoke'
        );
    END IF;

    -- Record the change in history before deleting
    INSERT INTO access.access_history (
        user_access_id,
        changed_by,
        previous_settings,
        new_settings,
        change_reason
    )
    VALUES (
        v_access_record.id,
        p_revoked_by,
        jsonb_build_object(
            'access_overrides', v_access_record.access_overrides,
            'access_starts_at', v_access_record.access_starts_at
        ),
        NULL,
        p_reason
    );

    -- Delete the access record
    DELETE FROM access.user_access
    WHERE user_id = p_user_id AND content_id = p_content_id
    RETURNING jsonb_build_object(
        'operation', 'revoke',
        'user_id', user_id,
        'content_id', content_id,
        'revoked_by', p_revoked_by,
        'revoked_at', CURRENT_TIMESTAMP,
        'reason', p_reason
    ) INTO v_debug_info;

    RETURN v_debug_info;
END;
$$;

-- Create or replace the public wrapper for revoke
CREATE OR REPLACE FUNCTION public.revoke_user_access(
    p_user_id UUID,
    p_content_id UUID,
    p_revoked_by UUID,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN access.revoke_user_access(
        p_user_id,
        p_content_id,
        p_revoked_by,
        p_reason
    );
END;
$$;

-- Recreate the user_content_access view without access_status dependency
CREATE OR REPLACE VIEW access.user_content_access AS
WITH RECURSIVE content_tree AS (
  -- Base query for content
  SELECT 
    ua.user_id,
    c.id as content_id,
    c.title,
    'content' as type,
    (ua.access_starts_at IS NULL OR ua.access_starts_at <= CURRENT_TIMESTAMP) as has_access,
    NULL::uuid as parent_id,
    ua.access_starts_at,
    ua.access_overrides
  FROM access.user_access ua
  JOIN content.content c ON c.id = ua.content_id
  
  UNION ALL
  
  -- Recursive part for modules and media
  SELECT
    ct.user_id,
    item.id,
    item.title,
    item.type::text,
    CASE
      WHEN ct.has_access = false THEN false
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'locked' THEN false
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'pending' 
        AND ct.access_starts_at + make_interval(
          days := (ct.access_overrides->'modules'->(item.id::text)->'delay'->>'value')::int
        ) > CURRENT_TIMESTAMP THEN false
      WHEN ct.access_overrides->'media'->(item.id::text)->>'status' = 'locked' THEN false
      WHEN ct.access_overrides->'media'->(item.id::text)->>'status' = 'pending'
        AND ct.access_starts_at + make_interval(
          days := (ct.access_overrides->'media'->(item.id::text)->'delay'->>'value')::int
        ) > CURRENT_TIMESTAMP THEN false
      ELSE true
    END as has_access,
    ct.content_id as parent_id,
    ct.access_starts_at,
    ct.access_overrides
  FROM content_tree ct
  JOIN LATERAL (
    SELECT m.id, m.title, 'module' as type FROM content.modules m WHERE m.content_id = ct.content_id
    UNION ALL
    SELECT med.id, med.title, 'media' as type FROM content.media med WHERE med.module_id IN (
      SELECT m2.id FROM content.modules m2 WHERE m2.content_id = ct.content_id
    )
  ) item ON true
)
SELECT 
  user_id,
  content_id as id,
  title,
  type,
  has_access,
  parent_id
FROM content_tree;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION access.grant_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION access.revoke_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_access TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION access.grant_user_access IS 'Grants or updates access to content for a user with optional overrides';
COMMENT ON FUNCTION access.revoke_user_access IS 'Revokes access by deleting the access record';
COMMENT ON FUNCTION public.grant_user_access IS 'Public wrapper for granting content access';
COMMENT ON FUNCTION public.revoke_user_access IS 'Public wrapper for revoking content access'; 