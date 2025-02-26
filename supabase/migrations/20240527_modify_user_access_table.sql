-- Migration: Modify user_access table structure
-- Description: Add type column and rename content_id to target_id

-- Create type enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'access')) THEN
        CREATE TYPE access.access_type AS ENUM ('ai', 'content');
    END IF;
END $$;

-- Check what columns exist in the user_access table
DO $$ 
DECLARE
    v_status_column_name TEXT;
    v_has_status BOOLEAN := FALSE;
BEGIN
    -- Check if status column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'access'
        AND table_name = 'user_access'
        AND column_name = 'status'
    ) INTO v_has_status;
    
    IF v_has_status THEN
        v_status_column_name := 'status';
    ELSE
        -- Check if access_status column exists
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'access'
            AND table_name = 'user_access'
            AND column_name = 'access_status'
        ) INTO v_has_status;
        
        IF v_has_status THEN
            v_status_column_name := 'access_status';
        ELSE
            v_status_column_name := 'none';
        END IF;
    END IF;
    
    -- Store the column name in a temporary table for later use
    CREATE TEMP TABLE IF NOT EXISTS temp_column_names(
        column_name TEXT
    );
    
    DELETE FROM temp_column_names;
    INSERT INTO temp_column_names VALUES (v_status_column_name);
END $$;

-- Add type column with a default value of 'content' for existing records (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'access'
        AND table_name = 'user_access'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE access.user_access 
        ADD COLUMN type access.access_type;
        
        -- Set default value for existing records
        UPDATE access.user_access
        SET type = 'content'
        WHERE type IS NULL;
        
        -- Make type column NOT NULL after updating existing records
        ALTER TABLE access.user_access 
        ALTER COLUMN type SET NOT NULL;
    END IF;
END $$;

-- Rename content_id to target_id if it hasn't been renamed already
DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'access'
        AND table_name = 'user_access'
        AND column_name = 'content_id'
    ) THEN
        -- Rename content_id to target_id
        ALTER TABLE access.user_access 
        RENAME COLUMN content_id TO target_id;
        
        -- Update unique constraint
        ALTER TABLE access.user_access 
        DROP CONSTRAINT IF EXISTS user_access_user_id_content_id_key;
        
        -- Update indexes
        DROP INDEX IF EXISTS access.idx_user_access_content_id;
    END IF;
END $$;

-- Add new constraint and indexes if they don't exist
DO $$ BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_access_user_id_target_id_type_key'
    ) THEN
        ALTER TABLE access.user_access 
        ADD CONSTRAINT user_access_user_id_target_id_type_key UNIQUE(user_id, target_id, type);
    END IF;
    
    -- Check if the indexes already exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_user_access_target_id'
    ) THEN
        CREATE INDEX idx_user_access_target_id ON access.user_access(target_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_user_access_type'
    ) THEN
        CREATE INDEX idx_user_access_type ON access.user_access(type);
    END IF;
END $$;

-- Update functions that reference content_id in user_access table

-- Update grant_user_access function
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

    -- Call the internal function with the target_id parameter (formerly content_id)
    -- and specify 'content' as the type
    PERFORM access.grant_user_access(
        p_user_id,
        v_content_id,  -- This will be passed as target_id
        p_granted_by,
        'content'      -- Specify the type as 'content'
    );

    -- Return the modified structure
    RETURN v_modified_structure;
END;
$$;

-- Update the internal access.grant_user_access function to accept the type parameter
CREATE OR REPLACE FUNCTION access.grant_user_access(
    p_user_id UUID,
    p_target_id UUID,  -- Renamed from p_content_id
    p_granted_by UUID,
    p_type access.access_type DEFAULT 'content'  -- Add type parameter with default
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_access_id UUID;
    v_previous_overrides JSONB;
    v_overrides JSONB := '{}'::JSONB;
    v_status_column_name TEXT;
BEGIN
    -- Get the status column name
    SELECT column_name INTO v_status_column_name FROM temp_column_names LIMIT 1;
    
    -- Check if user already has access
    EXECUTE format('
        SELECT ua.access_overrides, ua.id 
        FROM access.user_access ua
        WHERE ua.user_id = %L 
        AND ua.target_id = %L
        AND ua.type = %L
    ', p_user_id, p_target_id, p_type) INTO v_previous_overrides, v_user_access_id;

    -- Upsert user_access
    IF v_status_column_name = 'status' THEN
        EXECUTE format('
            INSERT INTO access.user_access (
                user_id,
                target_id,
                type,
                granted_by,
                granted_at,
                access_starts_at,
                access_overrides,
                status
            )
            VALUES (
                %L,
                %L,
                %L,
                %L,
                NOW(),
                NOW(),
                %L,
                ''granted''
            )
            ON CONFLICT (user_id, target_id, type)
            DO UPDATE SET
                granted_by = %L,
                granted_at = NOW(),
                access_overrides = %L,
                status = ''granted''
            RETURNING id
        ', p_user_id, p_target_id, p_type, p_granted_by, v_overrides, p_granted_by, v_overrides) INTO v_user_access_id;
    ELSIF v_status_column_name = 'access_status' THEN
        EXECUTE format('
            INSERT INTO access.user_access (
                user_id,
                target_id,
                type,
                granted_by,
                granted_at,
                access_starts_at,
                access_overrides,
                access_status
            )
            VALUES (
                %L,
                %L,
                %L,
                %L,
                NOW(),
                NOW(),
                %L,
                ''granted''
            )
            ON CONFLICT (user_id, target_id, type)
            DO UPDATE SET
                granted_by = %L,
                granted_at = NOW(),
                access_overrides = %L,
                access_status = ''granted''
            RETURNING id
        ', p_user_id, p_target_id, p_type, p_granted_by, v_overrides, p_granted_by, v_overrides) INTO v_user_access_id;
    ELSE
        -- No status column exists, just insert without status
        EXECUTE format('
            INSERT INTO access.user_access (
                user_id,
                target_id,
                type,
                granted_by,
                granted_at,
                access_starts_at,
                access_overrides
            )
            VALUES (
                %L,
                %L,
                %L,
                %L,
                NOW(),
                NOW(),
                %L
            )
            ON CONFLICT (user_id, target_id, type)
            DO UPDATE SET
                granted_by = %L,
                granted_at = NOW(),
                access_overrides = %L
            RETURNING id
        ', p_user_id, p_target_id, p_type, p_granted_by, v_overrides, p_granted_by, v_overrides) INTO v_user_access_id;
    END IF;

    -- Record history
    INSERT INTO access.access_history (
        user_access_id, changed_at, changed_by, previous_settings, new_settings
    ) VALUES (
        v_user_access_id, NOW(), p_granted_by, v_previous_overrides, v_overrides
    );

    -- Return the user_access ID
    RETURN v_user_access_id;
END;
$$;

-- Update get_user_access function
CREATE OR REPLACE FUNCTION public.get_user_access(
    p_user_id UUID,
    p_target_id UUID,  -- Renamed from p_content_id
    p_type access.access_type DEFAULT 'content'  -- Add type parameter with default
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_status_column_name TEXT;
BEGIN
    -- Get the status column name
    SELECT column_name INTO v_status_column_name FROM temp_column_names LIMIT 1;
    
    -- Build the query dynamically based on the status column name
    IF v_status_column_name = 'status' THEN
        EXECUTE format('
            SELECT jsonb_build_object(
                ''id'', ua.id,
                ''user_id'', ua.user_id,
                ''target_id'', ua.target_id,
                ''type'', ua.type,
                ''granted_by'', ua.granted_by,
                ''granted_at'', ua.granted_at,
                ''access_starts_at'', ua.access_starts_at,
                ''access_overrides'', ua.access_overrides,
                ''status'', ua.status
            )
            FROM access.user_access ua
            WHERE ua.user_id = %L 
            AND ua.target_id = %L
            AND ua.type = %L
        ', p_user_id, p_target_id, p_type) INTO v_result;
    ELSIF v_status_column_name = 'access_status' THEN
        EXECUTE format('
            SELECT jsonb_build_object(
                ''id'', ua.id,
                ''user_id'', ua.user_id,
                ''target_id'', ua.target_id,
                ''type'', ua.type,
                ''granted_by'', ua.granted_by,
                ''granted_at'', ua.granted_at,
                ''access_starts_at'', ua.access_starts_at,
                ''access_overrides'', ua.access_overrides,
                ''status'', ua.access_status
            )
            FROM access.user_access ua
            WHERE ua.user_id = %L 
            AND ua.target_id = %L
            AND ua.type = %L
        ', p_user_id, p_target_id, p_type) INTO v_result;
    ELSE
        -- No status column exists
        EXECUTE format('
            SELECT jsonb_build_object(
                ''id'', ua.id,
                ''user_id'', ua.user_id,
                ''target_id'', ua.target_id,
                ''type'', ua.type,
                ''granted_by'', ua.granted_by,
                ''granted_at'', ua.granted_at,
                ''access_starts_at'', ua.access_starts_at,
                ''access_overrides'', ua.access_overrides
            )
            FROM access.user_access ua
            WHERE ua.user_id = %L 
            AND ua.target_id = %L
            AND ua.type = %L
        ', p_user_id, p_target_id, p_type) INTO v_result;
    END IF;

    RETURN v_result;
END;
$$;

-- Update check_user_access function
CREATE OR REPLACE FUNCTION public.check_user_access(
    p_user_id UUID,
    p_target_id UUID,  -- Renamed from p_content_id
    p_type access.access_type DEFAULT 'content'  -- Add type parameter with default
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_access BOOLEAN;
    v_status_column_name TEXT;
BEGIN
    -- Get the status column name
    SELECT column_name INTO v_status_column_name FROM temp_column_names LIMIT 1;
    
    -- Check access based on the status column name
    IF v_status_column_name = 'status' THEN
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1
                FROM access.user_access ua
                WHERE ua.user_id = %L 
                AND ua.target_id = %L
                AND ua.type = %L
                AND ua.status = ''granted''
            )
        ', p_user_id, p_target_id, p_type) INTO v_has_access;
    ELSIF v_status_column_name = 'access_status' THEN
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1
                FROM access.user_access ua
                WHERE ua.user_id = %L 
                AND ua.target_id = %L
                AND ua.type = %L
                AND ua.access_status = ''granted''
            )
        ', p_user_id, p_target_id, p_type) INTO v_has_access;
    ELSE
        -- No status column exists, just check if the record exists
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1
                FROM access.user_access ua
                WHERE ua.user_id = %L 
                AND ua.target_id = %L
                AND ua.type = %L
            )
        ', p_user_id, p_target_id, p_type) INTO v_has_access;
    END IF;

    RETURN v_has_access;
END;
$$;

-- Update revoke_user_access function
CREATE OR REPLACE FUNCTION public.revoke_user_access(
    p_user_id UUID,
    p_target_id UUID,  -- Renamed from p_content_id
    p_revoked_by UUID,
    p_type access.access_type DEFAULT 'content'  -- Add type parameter with default
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_access_id UUID;
    v_previous_overrides JSONB;
    v_status_column_name TEXT;
BEGIN
    -- Get the status column name
    SELECT column_name INTO v_status_column_name FROM temp_column_names LIMIT 1;
    
    -- Get existing access record
    EXECUTE format('
        SELECT ua.id, ua.access_overrides
        FROM access.user_access ua
        WHERE ua.user_id = %L 
        AND ua.target_id = %L
        AND ua.type = %L
    ', p_user_id, p_target_id, p_type) INTO v_user_access_id, v_previous_overrides;

    -- If no access record exists, return false
    IF v_user_access_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Record history
    INSERT INTO access.access_history (
        user_access_id, changed_at, changed_by, previous_settings, new_settings
    ) VALUES (
        v_user_access_id, NOW(), p_revoked_by, v_previous_overrides, NULL
    );

    -- Delete the access record
    DELETE FROM access.user_access
    WHERE id = v_user_access_id;

    RETURN TRUE;
END;
$$;

-- Update any views that reference user_access.content_id
-- Example (you'll need to update all affected views):
DO $$ 
DECLARE
    v_status_column_name TEXT;
BEGIN
    -- Get the status column name
    SELECT column_name INTO v_status_column_name FROM temp_column_names LIMIT 1;
    
    -- Create views based on the status column name
    IF v_status_column_name = 'status' THEN
        EXECUTE '
            CREATE OR REPLACE VIEW access.user_content_access AS
            SELECT 
                ua.id,
                ua.user_id,
                ua.target_id,
                ua.type,
                ua.granted_by,
                ua.granted_at,
                ua.access_starts_at,
                ua.access_overrides,
                ua.status
            FROM access.user_access ua
            WHERE ua.type = ''content'';
            
            CREATE OR REPLACE VIEW access.user_ai_access AS
            SELECT 
                ua.id,
                ua.user_id,
                ua.target_id,
                ua.type,
                ua.granted_by,
                ua.granted_at,
                ua.access_starts_at,
                ua.access_overrides,
                ua.status
            FROM access.user_access ua
            WHERE ua.type = ''ai'';
        ';
    ELSIF v_status_column_name = 'access_status' THEN
        EXECUTE '
            CREATE OR REPLACE VIEW access.user_content_access AS
            SELECT 
                ua.id,
                ua.user_id,
                ua.target_id,
                ua.type,
                ua.granted_by,
                ua.granted_at,
                ua.access_starts_at,
                ua.access_overrides,
                ua.access_status AS status
            FROM access.user_access ua
            WHERE ua.type = ''content'';
            
            CREATE OR REPLACE VIEW access.user_ai_access AS
            SELECT 
                ua.id,
                ua.user_id,
                ua.target_id,
                ua.type,
                ua.granted_by,
                ua.granted_at,
                ua.access_starts_at,
                ua.access_overrides,
                ua.access_status AS status
            FROM access.user_access ua
            WHERE ua.type = ''ai'';
        ';
    ELSE
        -- No status column exists, create views without status
        EXECUTE '
            CREATE OR REPLACE VIEW access.user_content_access AS
            SELECT 
                ua.id,
                ua.user_id,
                ua.target_id,
                ua.type,
                ua.granted_by,
                ua.granted_at,
                ua.access_starts_at,
                ua.access_overrides
            FROM access.user_access ua
            WHERE ua.type = ''content'';
            
            CREATE OR REPLACE VIEW access.user_ai_access AS
            SELECT 
                ua.id,
                ua.user_id,
                ua.target_id,
                ua.type,
                ua.granted_by,
                ua.granted_at,
                ua.access_starts_at,
                ua.access_overrides
            FROM access.user_access ua
            WHERE ua.type = ''ai'';
        ';
    END IF;
END $$; 