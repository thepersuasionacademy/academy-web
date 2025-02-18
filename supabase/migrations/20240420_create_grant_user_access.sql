-- Create access schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS access;

-- Create user_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS access.user_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    content_id uuid NOT NULL,
    granted_by uuid REFERENCES auth.users(id),
    granted_at timestamptz NOT NULL DEFAULT now(),
    access_starts_at timestamptz NOT NULL DEFAULT now(),
    access_ends_at timestamptz,
    metadata jsonb,
    UNIQUE(user_id, content_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON access.user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_content_id ON access.user_access(content_id);

-- Create the function
CREATE OR REPLACE FUNCTION public.grant_user_access(
    p_user_id UUID,
    p_content_structure JSONB,
    p_granted_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    node_record RECORD;
    access_starts_at TIMESTAMPTZ;
BEGIN
    -- Validate input
    IF p_content_structure IS NULL OR jsonb_array_length(p_content_structure) = 0 THEN
        RAISE EXCEPTION 'Content structure cannot be null or empty';
    END IF;

    -- Process each node in the content structure
    FOR node_record IN 
        WITH RECURSIVE content_tree AS (
            -- Base case: process top-level nodes
            SELECT 
                node.value->>'id' as content_id,
                node.value->>'type' as content_type,
                (node.value->>'hasAccess')::boolean as has_access,
                node.value->'accessDelay' as access_delay,
                node.value->'children' as children,
                1 as level
            FROM jsonb_array_elements(p_content_structure) node
            
            UNION ALL
            
            -- Recursive case: process children
            SELECT 
                child.value->>'id',
                child.value->>'type',
                (child.value->>'hasAccess')::boolean,
                child.value->'accessDelay',
                child.value->'children',
                ct.level + 1
            FROM content_tree ct,
                 jsonb_array_elements(ct.children) child
            WHERE jsonb_typeof(ct.children) = 'array'
              AND jsonb_array_length(ct.children) > 0
        )
        SELECT * FROM content_tree
        -- Only process nodes with valid UUIDs (exclude compound IDs with -video, -text, etc.)
        WHERE content_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    LOOP
        -- Skip if node has no access
        IF NOT node_record.has_access THEN
            CONTINUE;
        END IF;

        -- Calculate access_starts_at based on delay if present
        IF node_record.access_delay IS NOT NULL THEN
            CASE node_record.access_delay->>'unit'
                WHEN 'days' THEN 
                    access_starts_at := NOW() + ((node_record.access_delay->>'value')::INTEGER || ' days')::INTERVAL;
                WHEN 'weeks' THEN 
                    access_starts_at := NOW() + ((node_record.access_delay->>'value')::INTEGER || ' weeks')::INTERVAL;
                WHEN 'months' THEN 
                    access_starts_at := NOW() + ((node_record.access_delay->>'value')::INTEGER || ' months')::INTERVAL;
                ELSE
                    access_starts_at := NOW();
            END CASE;
        ELSE
            access_starts_at := NOW();
        END IF;

        -- Insert or update access record
        INSERT INTO access.user_access (
            user_id,
            content_id,
            granted_by,
            granted_at,
            access_starts_at,
            metadata
        )
        VALUES (
            p_user_id,
            node_record.content_id::UUID,
            p_granted_by,
            NOW(),
            access_starts_at,
            jsonb_build_object(
                'accessDelay', node_record.access_delay,
                'contentType', node_record.content_type,
                'level', node_record.level
            )
        )
        ON CONFLICT (user_id, content_id) 
        DO UPDATE SET
            granted_by = EXCLUDED.granted_by,
            granted_at = EXCLUDED.granted_at,
            access_starts_at = EXCLUDED.access_starts_at,
            metadata = EXCLUDED.metadata;
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.grant_user_access TO authenticated; 