-- First ensure the access schema function exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'access' 
        AND p.proname = 'grant_user_access'
    ) THEN
        EXECUTE $func$
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
        AS $grant$
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

            RETURN v_debug_info;
        END;
        $grant$;
        $func$;
    END IF;
END $$;

-- Drop all existing versions of the public function
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, text);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, text, jsonb);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, text, jsonb, timestamptz);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, jsonb, timestamptz);

-- Create a public wrapper for access.grant_user_access
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
SET search_path = public
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

-- Grant execute permissions on the public function
GRANT EXECUTE ON FUNCTION public.grant_user_access(UUID, UUID, UUID, jsonb, timestamptz) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.grant_user_access(UUID, UUID, UUID, jsonb, timestamptz) IS 'Public wrapper for access.grant_user_access to manage content access permissions'; 