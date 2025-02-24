-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, text);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, text, jsonb);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, jsonb);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, UUID, UUID, jsonb, timestamptz);
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, JSONB, UUID);

-- Recreate the function with preserved timestamps on updates
CREATE OR REPLACE FUNCTION public.grant_user_access(
    p_user_id UUID,
    p_content_id UUID,
    p_granted_by UUID,
    p_access_overrides JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
DECLARE
    debug_info JSONB;
    v_content_id UUID;
    v_modified_structure JSONB;
BEGIN
    -- Initialize debug info
    debug_info := jsonb_build_object(
        'user_id', p_user_id,
        'content_id', p_content_id,
        'granted_by', p_granted_by,
        'access_overrides', p_access_overrides
    );

    -- First check if a record exists
    IF EXISTS (
        SELECT 1 FROM access.user_access ua
        WHERE ua.user_id = p_user_id 
        AND ua.content_id = p_content_id
    ) THEN
        -- Update existing record with history tracking, preserving timestamps
        WITH old_settings AS (
            SELECT ua.id, ua.access_overrides 
            FROM access.user_access ua
            WHERE ua.user_id = p_user_id 
            AND ua.content_id = p_content_id
        ),
        update_record AS (
            UPDATE access.user_access ua
            SET 
                access_overrides = p_access_overrides
            FROM old_settings os
            WHERE ua.id = os.id
            RETURNING ua.id, os.access_overrides as old_settings
        )
        -- Record the change in access_history
        INSERT INTO access.access_history (
            user_access_id,
            changed_by,
            previous_settings,
            new_settings
        )
        SELECT 
            id,
            p_granted_by,
            old_settings,
            p_access_overrides
        FROM update_record;

        debug_info := jsonb_set(debug_info, '{operation}', '"update"'::jsonb);
    ELSE
        -- Insert new record
        WITH new_access AS (
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
                NOW(),
                p_access_overrides,
                NOW()
            )
            RETURNING id
        )
        -- Record the initial grant in access_history
        INSERT INTO access.access_history (
            user_access_id,
            changed_by,
            previous_settings,
            new_settings
        )
        SELECT 
            id,
            p_granted_by,
            NULL,
            p_access_overrides
        FROM new_access;

        debug_info := jsonb_set(debug_info, '{operation}', '"insert"'::jsonb);
    END IF;

    -- Add the updated record to debug info
    SELECT jsonb_set(
        debug_info,
        '{updated_record}',
        row_to_json(ua)::jsonb
    )
    INTO debug_info
    FROM access.user_access ua
    WHERE ua.user_id = p_user_id
    AND ua.content_id = p_content_id;

    RETURN debug_info;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.grant_user_access(UUID, UUID, UUID, JSONB) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.grant_user_access(UUID, UUID, UUID, JSONB) IS 'Grants or updates content access, preserving original timestamps when updating existing access.'; 