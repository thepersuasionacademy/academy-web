-- Create RPC function for getting access lists by type
-- Description: Function to get access lists filtered by list_type

-- Check if required tables exist
DO $$
BEGIN
    -- Check that prerequisite tables exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'access' AND table_name = 'access_lists'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table "access.access_lists" does not exist. Please run prior migrations first.';
    END IF;
END $$;

-- Function to get access lists filtered by list_type
CREATE OR REPLACE FUNCTION "access"."get_access_lists_by_type"(
    p_list_type TEXT[] DEFAULT NULL
) RETURNS SETOF "access"."access_lists" AS $$
BEGIN
    -- Check if current user is admin or super_admin
    IF auth.jwt() ->> 'role' != 'admin' AND auth.jwt() ->> 'role' != 'super_admin' THEN
        RAISE EXCEPTION 'Only administrators can view access lists';
    END IF;

    -- Return all lists or filter by list_type if provided
    RETURN QUERY
    SELECT *
    FROM "access"."access_lists"
    WHERE 
        (p_list_type IS NULL OR "list_type" = ANY(p_list_type))
    ORDER BY "name" ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get access lists organized by bundles and variations
CREATE OR REPLACE FUNCTION "access"."get_access_lists_organized"(
    p_list_type TEXT[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_bundle_groups JSONB;
    v_custom_lists JSONB;
BEGIN
    -- Check if current user is admin or super_admin
    IF auth.jwt() ->> 'role' != 'admin' AND auth.jwt() ->> 'role' != 'super_admin' THEN
        RAISE EXCEPTION 'Only administrators can view access lists';
    END IF;

    -- If we're looking for auto lists, organize them by bundles and variations
    IF p_list_type IS NOT NULL AND 
       ('auto_bundle' = ANY(p_list_type) OR 'auto_variation' = ANY(p_list_type)) THEN
        
        -- Get bundle groups with their auto-lists
        WITH bundle_data AS (
            -- Get all bundles
            SELECT 
                b.id AS bundle_id,
                b.name AS bundle_name,
                (
                    SELECT jsonb_build_object(
                        'id', al.id,
                        'name', al.name,
                        'description', al.description,
                        'list_type', al.list_type,
                        'bundle_id', al.bundle_id,
                        'created_at', al.created_at,
                        'updated_at', al.updated_at
                    )
                    FROM "access"."access_lists" al
                    WHERE al.bundle_id = b.id AND al.list_type = 'auto_bundle'
                    LIMIT 1
                ) AS bundle_list,
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'variation_id', bv.id,
                            'variation_name', bv.variation_name,
                            'list', jsonb_build_object(
                                'id', al.id,
                                'name', al.name,
                                'description', al.description,
                                'list_type', al.list_type,
                                'variation_id', al.variation_id,
                                'created_at', al.created_at,
                                'updated_at', al.updated_at
                            )
                        )
                    )
                    FROM "access"."bundle_variations" bv
                    JOIN "access"."access_lists" al ON al.variation_id = bv.id
                    WHERE bv.bundle_id = b.id AND al.list_type = 'auto_variation'
                    ORDER BY bv.variation_name
                ) AS variations
            FROM "access"."bundles" b
            WHERE EXISTS (
                SELECT 1 
                FROM "access"."access_lists" al 
                WHERE (al.bundle_id = b.id AND al.list_type = 'auto_bundle')
                   OR EXISTS (
                      SELECT 1 
                      FROM "access"."bundle_variations" bv
                      JOIN "access"."access_lists" al2 ON al2.variation_id = bv.id
                      WHERE bv.bundle_id = b.id AND al2.list_type = 'auto_variation'
                   )
            )
            ORDER BY b.name
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'bundle_id', bundle_id,
                'bundle_name', bundle_name,
                'bundle_list', bundle_list,
                'variations', COALESCE(variations, '[]'::jsonb)
            )
        ) INTO v_bundle_groups
        FROM bundle_data;
        
        v_result := jsonb_build_object(
            'bundle_groups', COALESCE(v_bundle_groups, '[]'::jsonb)
        );
    ELSE
        -- For custom lists, just return a flat list
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', al.id,
                'name', al.name,
                'description', al.description,
                'list_type', al.list_type,
                'bundle_id', al.bundle_id,
                'variation_id', al.variation_id,
                'created_at', al.created_at,
                'updated_at', al.updated_at
            )
        ) INTO v_custom_lists
        FROM "access"."access_lists" al
        WHERE p_list_type IS NULL OR al.list_type = ANY(p_list_type)
        ORDER BY al.name;
        
        v_result := jsonb_build_object(
            'lists', COALESCE(v_custom_lists, '[]'::jsonb)
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', v_result
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "access"."get_access_lists_by_type" TO authenticated;
GRANT EXECUTE ON FUNCTION "access"."get_access_lists_organized" TO authenticated; 