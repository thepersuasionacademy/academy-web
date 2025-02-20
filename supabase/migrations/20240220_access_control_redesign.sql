-- Migration: Access Control System Redesign
-- Description: Implements new access control system with binary status and overrides

-- Enable RLS
ALTER TABLE access.user_access ENABLE ROW LEVEL SECURITY;

-- Add new columns with temporary nullable constraint if they don't exist
DO $$ 
BEGIN
    -- Add access_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'access' 
        AND table_name = 'user_access' 
        AND column_name = 'access_status'
    ) THEN
        ALTER TABLE access.user_access ADD COLUMN access_status text;
    END IF;

    -- Add access_overrides if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'access' 
        AND table_name = 'user_access' 
        AND column_name = 'access_overrides'
    ) THEN
        ALTER TABLE access.user_access ADD COLUMN access_overrides jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create validation function for access_overrides
CREATE OR REPLACE FUNCTION access.validate_access_overrides()
RETURNS trigger AS $$
DECLARE
  module_override record;
  media_override record;
BEGIN
  -- Initialize access_overrides if NULL
  IF NEW.access_overrides IS NULL THEN
    NEW.access_overrides := '{}'::jsonb;
  END IF;

  -- Ensure base structure exists
  IF NOT (
    jsonb_typeof(NEW.access_overrides) = 'object'
  ) THEN
    RAISE EXCEPTION 'access_overrides must be a JSON object';
  END IF;

  -- Validate modules if present
  IF NEW.access_overrides ? 'modules' AND jsonb_typeof(NEW.access_overrides->'modules') = 'object' THEN
    FOR module_override IN 
      SELECT * FROM jsonb_each(NEW.access_overrides->'modules')
    LOOP
      IF NOT (
        jsonb_typeof(module_override.value) = 'object' AND
        module_override.value ? 'status' AND
        module_override.value->>'status' IN ('locked', 'pending')
      ) THEN
        RAISE EXCEPTION 'Invalid module override structure: %', module_override.value;
      END IF;

      -- Validate delay if status is pending
      IF module_override.value->>'status' = 'pending' AND module_override.value ? 'delay' THEN
        IF NOT (
          jsonb_typeof(module_override.value->'delay') = 'object' AND
          module_override.value->'delay' ? 'value' AND
          module_override.value->'delay' ? 'unit' AND
          module_override.value->'delay'->>'unit' IN ('days', 'weeks', 'months')
        ) THEN
          RAISE EXCEPTION 'Invalid delay structure in module override: %', module_override.value->'delay';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Validate media if present
  IF NEW.access_overrides ? 'media' AND jsonb_typeof(NEW.access_overrides->'media') = 'object' THEN
    FOR media_override IN 
      SELECT * FROM jsonb_each(NEW.access_overrides->'media')
    LOOP
      IF NOT (
        jsonb_typeof(media_override.value) = 'object' AND
        media_override.value ? 'status' AND
        media_override.value->>'status' IN ('locked', 'pending')
      ) THEN
        RAISE EXCEPTION 'Invalid media override structure: %', media_override.value;
      END IF;

      -- Validate delay if status is pending
      IF media_override.value->>'status' = 'pending' AND media_override.value ? 'delay' THEN
        IF NOT (
          jsonb_typeof(media_override.value->'delay') = 'object' AND
          media_override.value->'delay' ? 'value' AND
          media_override.value->'delay' ? 'unit' AND
          media_override.value->'delay'->>'unit' IN ('days', 'weeks', 'months')
        ) THEN
          RAISE EXCEPTION 'Invalid delay structure in media override: %', media_override.value->'delay';
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for validation
DROP TRIGGER IF EXISTS validate_access_overrides_trigger ON access.user_access;
CREATE TRIGGER validate_access_overrides_trigger
  BEFORE INSERT OR UPDATE ON access.user_access
  FOR EACH ROW
  EXECUTE FUNCTION access.validate_access_overrides();

-- Drop and recreate indexes
DROP INDEX IF EXISTS access.idx_user_access_status;
DROP INDEX IF EXISTS access.idx_user_access_overrides;

CREATE INDEX IF NOT EXISTS idx_user_access_status ON access.user_access(access_status);
CREATE INDEX IF NOT EXISTS idx_user_access_overrides ON access.user_access USING gin(access_overrides);

-- Migrate existing data
UPDATE access.user_access
SET access_status = 
  CASE 
    WHEN is_active AND access_settings->0->>'hasAccess' = 'true' THEN 'granted'
    ELSE 'denied'
  END,
access_overrides = (
  SELECT jsonb_build_object(
    'modules', (
      SELECT jsonb_object_agg(
        id,
        jsonb_build_object(
          'status',
          CASE 
            WHEN node->>'hasAccess' = 'false' THEN 'locked'
            WHEN node->'accessDelay' IS NOT NULL THEN 'pending'
            ELSE NULL
          END,
          'delay',
          CASE 
            WHEN node->'accessDelay' IS NOT NULL THEN node->'accessDelay'
            ELSE NULL
          END
        )
      )
      FROM jsonb_array_elements(access_settings) AS content,
           jsonb_array_elements(content->'children') AS modules,
           jsonb_array_elements(modules->'children') AS node
      WHERE node->>'type' = 'module'
        AND (node->>'hasAccess' = 'false' OR node->'accessDelay' IS NOT NULL)
    ),
    'media', (
      SELECT jsonb_object_agg(
        id,
        jsonb_build_object(
          'status',
          CASE 
            WHEN node->>'hasAccess' = 'false' THEN 'locked'
            WHEN node->'accessDelay' IS NOT NULL THEN 'pending'
            ELSE NULL
          END,
          'delay',
          CASE 
            WHEN node->'accessDelay' IS NOT NULL THEN node->'accessDelay'
            ELSE NULL
          END
        )
      )
      FROM jsonb_array_elements(access_settings) AS content,
           jsonb_array_elements(content->'children') AS modules,
           jsonb_array_elements(modules->'children') AS media,
           jsonb_array_elements(media->'children') AS node
      WHERE node->>'type' = 'media'
        AND (node->>'hasAccess' = 'false' OR node->'accessDelay' IS NOT NULL)
    )
  )
);

-- Add NOT NULL constraint and check constraint if they don't exist
DO $$
BEGIN
    -- Set NOT NULL if it's not already
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'access'
        AND table_name = 'user_access'
        AND column_name = 'access_status'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE access.user_access ALTER COLUMN access_status SET NOT NULL;
    END IF;

    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'check_access_status'
        AND conrelid = 'access.user_access'::regclass
    ) THEN
        ALTER TABLE access.user_access
        ADD CONSTRAINT check_access_status CHECK (access_status IN ('granted', 'denied'));
    END IF;
END $$;

-- Drop old columns (only after verifying migration success)
-- ALTER TABLE access.user_access DROP COLUMN is_active;
-- ALTER TABLE access.user_access DROP COLUMN access_settings;

COMMENT ON COLUMN access.user_access.access_status IS 'Binary access status: granted or denied';
COMMENT ON COLUMN access.user_access.access_overrides IS 'JSON containing module and media-specific access overrides';

-- Create view for easy access checking
CREATE OR REPLACE VIEW access.user_content_access AS
WITH RECURSIVE content_tree AS (
  -- Base query for content
  SELECT 
    ua.user_id,
    c.id as content_id,
    c.title as content_title,
    'content' as type,
    ua.access_status,
    ua.access_starts_at,
    ua.access_overrides,
    NULL::uuid as parent_id
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
      WHEN ct.access_status = 'denied' THEN 'denied'
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'locked' THEN 'denied'
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'pending' THEN 'pending'
      WHEN ct.access_overrides->'media'->(item.id::text)->>'status' = 'locked' THEN 'denied'
      WHEN ct.access_overrides->'media'->(item.id::text)->>'status' = 'pending' THEN 'pending'
      ELSE ct.access_status
    END as access_status,
    CASE
      WHEN ct.access_overrides->'modules'->(item.id::text)->>'status' = 'pending' 
      OR ct.access_overrides->'media'->(item.id::text)->>'status' = 'pending' THEN
        ct.access_starts_at + 
        make_interval(
          days := COALESCE(
            (ct.access_overrides->'modules'->(item.id::text)->'delay'->>'value')::int,
            (ct.access_overrides->'media'->(item.id::text)->'delay'->>'value')::int,
            0
          )
        )
      ELSE ct.access_starts_at
    END as access_starts_at,
    ct.access_overrides,
    ct.content_id as parent_id
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
  content_id,
  content_title,
  type,
  access_status,
  access_starts_at,
  parent_id,
  access_status = 'granted' 
  AND (access_starts_at IS NULL OR access_starts_at <= CURRENT_TIMESTAMP) as has_current_access
FROM content_tree;

-- Drop all functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS access.grant_user_access CASCADE;
DROP FUNCTION IF EXISTS access.check_user_access CASCADE;
DROP FUNCTION IF EXISTS access.revoke_user_access CASCADE;
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, JSONB, UUID) CASCADE;

-- Create or replace the grant access function
CREATE OR REPLACE FUNCTION access.grant_user_access(
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
DECLARE
    v_debug_info jsonb;
BEGIN
    -- Validate input parameters
    IF p_access_status NOT IN ('granted', 'denied') THEN
        RAISE EXCEPTION 'Invalid access_status. Must be either granted or denied';
    END IF;

    -- Insert or update access record
    INSERT INTO access.user_access (
        user_id,
        content_id,
        granted_by,
        granted_at,
        access_status,
        access_overrides,
        access_starts_at
    )
    VALUES (
        p_user_id,
        p_content_id,
        p_granted_by,
        CURRENT_TIMESTAMP,
        p_access_status,
        p_access_overrides,
        p_access_starts_at
    )
    ON CONFLICT (user_id, content_id) 
    DO UPDATE SET
        granted_by = EXCLUDED.granted_by,
        granted_at = EXCLUDED.granted_at,
        access_status = EXCLUDED.access_status,
        access_overrides = EXCLUDED.access_overrides,
        access_starts_at = EXCLUDED.access_starts_at
    RETURNING jsonb_build_object(
        'operation', CASE WHEN xmax = 0 THEN 'insert' ELSE 'update' END,
        'user_id', user_id,
        'content_id', content_id,
        'access_status', access_status,
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
            'access_status', ua.access_status,
            'access_overrides', ua.access_overrides,
            'access_starts_at', ua.access_starts_at
        ),
        jsonb_build_object(
            'access_status', p_access_status,
            'access_overrides', p_access_overrides,
            'access_starts_at', p_access_starts_at
        )
    FROM access.user_access ua
    WHERE ua.user_id = p_user_id AND ua.content_id = p_content_id;

    RETURN v_debug_info;
END;
$$;

-- Create function to check current access status
CREATE OR REPLACE FUNCTION access.check_user_access(
    p_user_id UUID,
    p_content_id UUID
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT jsonb_build_object(
        'has_access', access_status = 'granted' 
            AND (access_starts_at IS NULL OR access_starts_at <= CURRENT_TIMESTAMP),
        'access_status', access_status,
        'access_starts_at', access_starts_at,
        'access_overrides', access_overrides
    )
    FROM access.user_access
    WHERE user_id = p_user_id AND content_id = p_content_id;
$$;

-- Create function to revoke access
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
BEGIN
    -- Update access status to denied
    UPDATE access.user_access
    SET 
        access_status = 'denied',
        access_overrides = '{}'::jsonb,
        granted_by = p_revoked_by,
        granted_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND content_id = p_content_id
    RETURNING jsonb_build_object(
        'operation', 'revoke',
        'user_id', user_id,
        'content_id', content_id,
        'revoked_by', p_revoked_by,
        'revoked_at', CURRENT_TIMESTAMP,
        'reason', p_reason
    ) INTO v_debug_info;

    -- Record the change in history
    INSERT INTO access.access_history (
        user_access_id,
        changed_by,
        previous_settings,
        new_settings,
        change_reason
    )
    SELECT 
        ua.id,
        p_revoked_by,
        jsonb_build_object(
            'access_status', ua.access_status,
            'access_overrides', ua.access_overrides,
            'access_starts_at', ua.access_starts_at
        ),
        jsonb_build_object(
            'access_status', 'denied',
            'access_overrides', '{}'::jsonb,
            'access_starts_at', CURRENT_TIMESTAMP
        ),
        p_reason
    FROM access.user_access ua
    WHERE ua.user_id = p_user_id AND ua.content_id = p_content_id;

    RETURN v_debug_info;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION access.grant_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION access.check_user_access TO authenticated;
GRANT EXECUTE ON FUNCTION access.revoke_user_access TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION access.grant_user_access IS 'Grants or updates access to content for a user with optional overrides';
COMMENT ON FUNCTION access.check_user_access IS 'Checks current access status for a user and content';
COMMENT ON FUNCTION access.revoke_user_access IS 'Revokes access to content for a user'; 