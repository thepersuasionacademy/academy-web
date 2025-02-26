-- Create get_access_lists_organized in public schema
CREATE OR REPLACE FUNCTION public.get_access_lists_organized(
    p_list_type TEXT[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_bundle_groups JSONB;
    v_custom_lists JSONB;
    v_is_admin BOOLEAN;
    v_is_super_admin BOOLEAN;
BEGIN
    -- Check if current user is admin or super_admin using RPC functions
    SELECT public.is_admin() INTO v_is_admin;
    SELECT public.is_super_admin() INTO v_is_super_admin;
    
    IF NOT (v_is_admin OR v_is_super_admin) THEN
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
                            'id', bv.id,
                            'name', bv.variation_name,
                            'description', bv.description,
                            'list', (
                                SELECT jsonb_build_object(
                                    'id', al.id,
                                    'name', al.name,
                                    'description', al.description,
                                    'list_type', al.list_type,
                                    'variation_id', al.variation_id,
                                    'created_at', al.created_at,
                                    'updated_at', al.updated_at
                                )
                                FROM "access"."access_lists" al
                                WHERE al.variation_id = bv.id AND al.list_type = 'auto_variation'
                                LIMIT 1
                            )
                        )
                    )
                    FROM "access"."bundle_variations" bv
                    WHERE bv.bundle_id = b.id
                    ORDER BY bv.variation_name
                ) AS variations
            FROM "access"."bundles" b
            ORDER BY b.name
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'bundle_id', bd.bundle_id,
                'bundle_name', bd.bundle_name,
                'bundle_list', bd.bundle_list,
                'variations', bd.variations
            )
        ) INTO v_bundle_groups
        FROM bundle_data bd;
        
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

-- Create get_list_members in public schema
CREATE OR REPLACE FUNCTION public.get_list_members(
    p_list_id UUID
) RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_super_admin BOOLEAN;
BEGIN
    -- Check if current user is admin or super_admin using RPC functions
    SELECT public.is_admin() INTO v_is_admin;
    SELECT public.is_super_admin() INTO v_is_super_admin;
    
    IF NOT (v_is_admin OR v_is_super_admin) THEN
        RAISE EXCEPTION 'Only administrators can view list members';
    END IF;

    -- Check if list exists
    IF NOT EXISTS (SELECT 1 FROM "access"."access_lists" WHERE "id" = p_list_id) THEN
        RAISE EXCEPTION 'Access list with ID % not found', p_list_id;
    END IF;

    -- Return list members with their email
    RETURN QUERY
    SELECT 
        lm."user_id",
        u.email,
        lm."created_at"
    FROM "access"."list_members" lm
    JOIN "auth"."users" u ON lm."user_id" = u.id
    WHERE lm."list_id" = p_list_id
    ORDER BY u.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_access_lists_organized(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_list_members(UUID) TO authenticated; 