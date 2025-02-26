-- Sample insert statements for the updated user_access table

-- First, check which status column exists
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
    
    -- Insert examples based on the status column name
    IF v_status_column_name = 'status' THEN
        -- Example 1: Insert a content access record with status column
        EXECUTE format('
            INSERT INTO "access"."user_access" (
                "id", 
                "user_id", 
                "target_id", 
                "type",
                "granted_by", 
                "granted_at", 
                "access_starts_at", 
                "access_overrides",
                "status"
            ) VALUES (
                ''fb2caf2f-af7b-4d0f-b20c-f2ce264acd2c'', 
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''34e045d5-c1d7-4e3c-80a3-5cc4f485655a'', 
                ''content'',
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''{"media": {"abc84830-2b92-495f-8f75-6892f1888172": {"delay": {"unit": "days", "value": 15}, "status": "pending"}}, "modules": {}}'',
                ''granted''
            );
        ');
    ELSIF v_status_column_name = 'access_status' THEN
        -- Example 1: Insert a content access record with access_status column
        EXECUTE format('
            INSERT INTO "access"."user_access" (
                "id", 
                "user_id", 
                "target_id", 
                "type",
                "granted_by", 
                "granted_at", 
                "access_starts_at", 
                "access_overrides",
                "access_status"
            ) VALUES (
                ''fb2caf2f-af7b-4d0f-b20c-f2ce264acd2c'', 
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''34e045d5-c1d7-4e3c-80a3-5cc4f485655a'', 
                ''content'',
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''{"media": {"abc84830-2b92-495f-8f75-6892f1888172": {"delay": {"unit": "days", "value": 15}, "status": "pending"}}, "modules": {}}'',
                ''granted''
            );
        ');
    ELSE
        -- No status column exists, insert without status
        EXECUTE format('
            INSERT INTO "access"."user_access" (
                "id", 
                "user_id", 
                "target_id", 
                "type",
                "granted_by", 
                "granted_at", 
                "access_starts_at", 
                "access_overrides"
            ) VALUES (
                ''fb2caf2f-af7b-4d0f-b20c-f2ce264acd2c'', 
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''34e045d5-c1d7-4e3c-80a3-5cc4f485655a'', 
                ''content'',
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''{"media": {"abc84830-2b92-495f-8f75-6892f1888172": {"delay": {"unit": "days", "value": 15}, "status": "pending"}}, "modules": {}}''
            );
        ');
    END IF;
    
    -- Example 2: Insert an AI access record
    IF v_status_column_name = 'status' THEN
        EXECUTE format('
            INSERT INTO "access"."user_access" (
                "id", 
                "user_id", 
                "target_id", 
                "type",
                "granted_by", 
                "granted_at", 
                "access_starts_at", 
                "access_overrides",
                "status"
            ) VALUES (
                ''a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d'', 
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''98765432-abcd-efgh-ijkl-1234567890ab'', 
                ''ai'',
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''{"settings": {"max_tokens": 4000, "temperature": 0.7}, "models": {"gpt-4": true, "claude-3": true}}'',
                ''granted''
            );
        ');
    ELSIF v_status_column_name = 'access_status' THEN
        EXECUTE format('
            INSERT INTO "access"."user_access" (
                "id", 
                "user_id", 
                "target_id", 
                "type",
                "granted_by", 
                "granted_at", 
                "access_starts_at", 
                "access_overrides",
                "access_status"
            ) VALUES (
                ''a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d'', 
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''98765432-abcd-efgh-ijkl-1234567890ab'', 
                ''ai'',
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''{"settings": {"max_tokens": 4000, "temperature": 0.7}, "models": {"gpt-4": true, "claude-3": true}}'',
                ''granted''
            );
        ');
    ELSE
        -- No status column exists, insert without status
        EXECUTE format('
            INSERT INTO "access"."user_access" (
                "id", 
                "user_id", 
                "target_id", 
                "type",
                "granted_by", 
                "granted_at", 
                "access_starts_at", 
                "access_overrides"
            ) VALUES (
                ''a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d'', 
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''98765432-abcd-efgh-ijkl-1234567890ab'', 
                ''ai'',
                ''4fed66d2-6325-49d5-a1d3-36e62d20660f'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''2025-02-24 18:12:47.266475+00'', 
                ''{"settings": {"max_tokens": 4000, "temperature": 0.7}, "models": {"gpt-4": true, "claude-3": true}}''
            );
        ');
    END IF;
END $$;

-- Example 3: Using the grant_user_access function for content access
SELECT access.grant_user_access(
    '4fed66d2-6325-49d5-a1d3-36e62d20660f',  -- user_id
    '34e045d5-c1d7-4e3c-80a3-5cc4f485655a',  -- target_id (formerly content_id)
    '4fed66d2-6325-49d5-a1d3-36e62d20660f',  -- granted_by
    'content'                                -- type
);

-- Example 4: Using the grant_user_access function for AI access
SELECT access.grant_user_access(
    '4fed66d2-6325-49d5-a1d3-36e62d20660f',  -- user_id
    '98765432-abcd-efgh-ijkl-1234567890ab',  -- target_id (AI model or tool ID)
    '4fed66d2-6325-49d5-a1d3-36e62d20660f',  -- granted_by
    'ai'                                     -- type
);

-- Example 5: Using the get_user_access function with the new type parameter
SELECT public.get_user_access(
    '4fed66d2-6325-49d5-a1d3-36e62d20660f',  -- user_id
    '34e045d5-c1d7-4e3c-80a3-5cc4f485655a',  -- target_id
    'content'                                -- type
);

-- Example 6: Using the check_user_access function with the new type parameter
SELECT public.check_user_access(
    '4fed66d2-6325-49d5-a1d3-36e62d20660f',  -- user_id
    '98765432-abcd-efgh-ijkl-1234567890ab',  -- target_id
    'ai'                                     -- type
); 