-- Drop the existing function
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, JSONB, UUID);

-- Recreate the function with explicit table references
CREATE OR REPLACE FUNCTION public.grant_user_access(
    p_user_id UUID,
    p_content_structure JSONB,
    p_granted_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    debug_info JSONB;
    v_content_id UUID;
    v_modified_structure JSONB;
BEGIN
    -- Get content ID from the root node
    v_content_id := (p_content_structure->0->>'id')::UUID;

    -- Validate input
    IF p_content_structure IS NULL OR jsonb_array_length(p_content_structure) = 0 THEN
        RAISE EXCEPTION 'Content structure cannot be null or empty';
    END IF;

    -- Modify the structure to set hasAccess based on accessDelay
    SELECT 
        CASE 
            WHEN element->>'accessDelay' IS NOT NULL THEN 
                jsonb_set(element, '{hasAccess}', 'false'::jsonb)
            ELSE element
        END
    INTO v_modified_structure
    FROM jsonb_array_elements(p_content_structure) element
    WHERE element->>'id' = v_content_id::text;

    v_modified_structure := jsonb_build_array(v_modified_structure);

    -- Initialize debug info
    debug_info := jsonb_build_object(
        'input_structure', p_content_structure,
        'modified_structure', v_modified_structure,
        'user_id', p_user_id,
        'granted_by', p_granted_by,
        'content_id', v_content_id
    );

    -- First check if a record exists
    IF EXISTS (
        SELECT 1 FROM access.user_access ua
        WHERE ua.user_id = p_user_id 
        AND ua.content_id = v_content_id
    ) THEN
        -- Update existing record with history tracking
        WITH old_settings AS (
            SELECT ua.id, ua.access_settings 
            FROM access.user_access ua
            WHERE ua.user_id = p_user_id 
            AND ua.content_id = v_content_id
        ),
        update_record AS (
            UPDATE access.user_access ua
            SET 
                granted_by = p_granted_by,
                granted_at = NOW(),
                access_settings = v_modified_structure,
                -- Update access_starts_at if there's a delay at the content level
                access_starts_at = CASE 
                    WHEN (p_content_structure->0->'accessDelay') IS NOT NULL THEN
                        NOW() + make_interval(
                            days := CASE 
                                WHEN (p_content_structure->0->'accessDelay'->>'unit') = 'days' THEN 
                                    (p_content_structure->0->'accessDelay'->>'value')::int
                                WHEN (p_content_structure->0->'accessDelay'->>'unit') = 'weeks' THEN 
                                    (p_content_structure->0->'accessDelay'->>'value')::int * 7
                                WHEN (p_content_structure->0->'accessDelay'->>'unit') = 'months' THEN 
                                    (p_content_structure->0->'accessDelay'->>'value')::int * 30
                                ELSE 0
                            END
                        )
                    ELSE NOW()
                END
            FROM old_settings os
            WHERE ua.id = os.id
            RETURNING ua.id, os.access_settings as old_settings
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
            v_modified_structure
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
                access_settings,
                access_starts_at
            )
            VALUES (
                p_user_id,
                v_content_id,
                p_granted_by,
                NOW(),
                v_modified_structure,
                -- Set access_starts_at based on content level delay
                CASE 
                    WHEN (p_content_structure->0->'accessDelay') IS NOT NULL THEN
                        NOW() + make_interval(
                            days := CASE 
                                WHEN (p_content_structure->0->'accessDelay'->>'unit') = 'days' THEN 
                                    (p_content_structure->0->'accessDelay'->>'value')::int
                                WHEN (p_content_structure->0->'accessDelay'->>'unit') = 'weeks' THEN 
                                    (p_content_structure->0->'accessDelay'->>'value')::int * 7
                                WHEN (p_content_structure->0->'accessDelay'->>'unit') = 'months' THEN 
                                    (p_content_structure->0->'accessDelay'->>'value')::int * 30
                                ELSE 0
                            END
                        )
                    ELSE NOW()
                END
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
            v_modified_structure
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
    AND ua.content_id = v_content_id;

    RETURN debug_info;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.grant_user_access TO authenticated; 