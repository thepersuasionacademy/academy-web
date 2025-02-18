-- Create access schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS access;

-- Drop any existing triggers and functions
DROP TRIGGER IF EXISTS user_access_status_change ON access.user_access;
DROP TRIGGER IF EXISTS user_access_update ON access.user_access;
DROP FUNCTION IF EXISTS access.user_access_status_change();
DROP FUNCTION IF EXISTS access.user_access_update();
DROP FUNCTION IF EXISTS public.activate_pending_access();

-- Safely backup existing access history if it exists with the right columns
DO $$
DECLARE
    has_previous_settings boolean;
    has_new_settings boolean;
BEGIN
    -- Check if the table exists first
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'access' 
        AND table_name = 'access_history'
    ) THEN
        -- Check which columns exist
        SELECT 
            EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'access' 
                AND table_name = 'access_history' 
                AND column_name = 'previous_settings'
            ),
            EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'access' 
                AND table_name = 'access_history' 
                AND column_name = 'new_settings'
            )
        INTO has_previous_settings, has_new_settings;

        -- Create temp table with only existing columns
        EXECUTE format(
            'CREATE TEMP TABLE temp_access_history AS
            SELECT 
                id,
                user_access_id,
                changed_at,
                changed_by
                %s
                %s
            FROM access.access_history',
            CASE WHEN has_previous_settings THEN ', previous_settings' ELSE ', NULL::jsonb as previous_settings' END,
            CASE WHEN has_new_settings THEN ', new_settings' ELSE ', NULL::jsonb as new_settings' END
        );
    END IF;
END $$;

-- Drop dependent objects and table
DROP TABLE IF EXISTS access.access_history CASCADE;
DROP TABLE IF EXISTS access.user_access CASCADE;

-- Create user_access table
CREATE TABLE access.user_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    content_id uuid NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamptz NOT NULL DEFAULT now(),
    access_starts_at timestamptz NOT NULL DEFAULT now(),
    access_settings jsonb NOT NULL DEFAULT '[]'::jsonb,
    UNIQUE(user_id, content_id)
);

-- Recreate access_history table
CREATE TABLE access.access_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_access_id uuid REFERENCES access.user_access(id) ON DELETE CASCADE,
    changed_at timestamptz NOT NULL DEFAULT now(),
    changed_by uuid REFERENCES auth.users(id),
    previous_settings jsonb,
    new_settings jsonb
);

-- Safely restore access history data if backup exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'pg_temp' 
        AND tablename = 'temp_access_history'
    ) THEN
        INSERT INTO access.access_history (
            id,
            user_access_id,
            changed_at,
            changed_by,
            previous_settings,
            new_settings
        )
        SELECT 
            id,
            user_access_id,
            changed_at,
            changed_by,
            previous_settings,
            new_settings
        FROM temp_access_history;

        DROP TABLE temp_access_history;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX idx_user_access_user_id ON access.user_access(user_id);
CREATE INDEX idx_user_access_content_id ON access.user_access(content_id);
CREATE INDEX idx_user_access_starts_at ON access.user_access(access_starts_at);
CREATE INDEX idx_access_history_user_access_id ON access.access_history(user_access_id);

-- Recreate RLS policy for access history
CREATE POLICY "Users can view their own access history" ON access.access_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM access.user_access ua
            WHERE ua.id = user_access_id
            AND ua.user_id = auth.uid()
        )
    );

-- Enable RLS on access_history
ALTER TABLE access.access_history ENABLE ROW LEVEL SECURITY;

-- Drop existing function
DROP FUNCTION IF EXISTS public.grant_user_access(UUID, JSONB, UUID);

-- Create the function
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
    content_id UUID;
BEGIN
    -- Get content ID from the root node
    content_id := (p_content_structure->0->>'id')::UUID;

    -- Validate input
    IF p_content_structure IS NULL OR jsonb_array_length(p_content_structure) = 0 THEN
        RAISE EXCEPTION 'Content structure cannot be null or empty';
    END IF;

    -- Initialize debug info
    debug_info := jsonb_build_object(
        'input_structure', p_content_structure,
        'user_id', p_user_id,
        'granted_by', p_granted_by,
        'content_id', content_id
    );

    -- First check if a record exists
    IF EXISTS (
        SELECT 1 FROM access.user_access 
        WHERE user_id = p_user_id 
        AND content_id = content_id
    ) THEN
        -- Update existing record with history tracking
        WITH old_settings AS (
            SELECT id, access_settings 
            FROM access.user_access 
            WHERE user_id = p_user_id 
            AND content_id = content_id
        ),
        update_record AS (
            UPDATE access.user_access ua
            SET 
                granted_by = p_granted_by,
                granted_at = NOW(),
                access_settings = p_content_structure,
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
            FROM old_settings
            WHERE ua.user_id = p_user_id 
            AND ua.content_id = content_id
            RETURNING ua.id, old_settings.access_settings as old_settings
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
            p_content_structure
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
                content_id,
                p_granted_by,
                NOW(),
                p_content_structure,
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
            p_content_structure
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
    AND ua.content_id = content_id;

    RETURN debug_info;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.grant_user_access TO authenticated; 