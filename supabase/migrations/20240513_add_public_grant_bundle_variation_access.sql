-- Drop the existing function first
DROP FUNCTION IF EXISTS public.grant_bundle_variation_access(UUID[], UUID);

-- Create a public wrapper for the access.grant_bundle_variation_access function
CREATE OR REPLACE FUNCTION public.grant_bundle_variation_access(
    user_ids UUID[],
    p_variation_id UUID  -- Renamed parameter to avoid ambiguity
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count INTEGER := 0;
    v_user_id UUID;
    v_template RECORD;
    v_result JSONB := '[]'::JSONB;
    v_existing_access RECORD;
    v_should_apply BOOLEAN;
    v_content_id UUID;
    v_ai_target_id UUID;
    v_is_full_access BOOLEAN;
    v_existing_is_full_access BOOLEAN;
    v_existing_overrides JSONB;
    v_new_overrides JSONB;
    v_final_overrides JSONB;
    v_has_media_restrictions BOOLEAN;
    v_has_module_restrictions BOOLEAN;
    v_new_has_media_restrictions BOOLEAN;
    v_new_has_module_restrictions BOOLEAN;
    v_user_results JSONB;
    v_all_results JSONB := '[]'::JSONB;
    v_debug_info JSONB;
BEGIN
    -- Remove admin check since it's already handled by RPC authorization
    
    -- Grant access to each user
    INSERT INTO access.bundle_variation_access (user_id, variation_id, created_by)
    SELECT 
        u.user_id,
        p_variation_id,  -- Use renamed parameter to avoid ambiguity
        auth.uid()
    FROM unnest(user_ids) AS u(user_id)
    ON CONFLICT (user_id, variation_id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- For each user, apply all templates in the variation
    FOREACH v_user_id IN ARRAY user_ids
    LOOP
        v_user_results := '[]'::JSONB;
        
        -- Loop through all templates in the variation
        FOR v_template IN (
            SELECT 
                bt.template_type,
                bt.template_id,
                CASE 
                    WHEN bt.template_type = 'content' THEN 
                        jsonb_build_object(
                            'content_id', ct.content_id,
                            'access_overrides', ct.access_overrides
                        )
                    WHEN bt.template_type = 'ai' THEN 
                        jsonb_build_object(
                            'target_id', at.target_id
                        )
                END as template_details
            FROM access.bundle_templates bt
            LEFT JOIN access.content_templates ct ON bt.template_type = 'content' AND bt.template_id = ct.id
            LEFT JOIN access.ai_templates at ON bt.template_type = 'ai' AND bt.template_id = at.id
            WHERE bt.bundle_variation_id = p_variation_id
        )
        LOOP
            v_should_apply := TRUE; -- Default to applying the template
            v_debug_info := jsonb_build_object(
                'template_id', v_template.template_id,
                'template_type', v_template.template_type,
                'template_details', v_template.template_details
            );
            
            -- For content templates
            IF v_template.template_type = 'content' THEN
                -- Extract content ID from the template
                v_content_id := (v_template.template_details->>'content_id')::UUID;
                v_new_overrides := v_template.template_details->'access_overrides';
                
                v_debug_info := v_debug_info || jsonb_build_object(
                    'content_id', v_content_id,
                    'new_overrides', v_new_overrides
                );
                
                -- Check if new template has media or module restrictions
                v_new_has_media_restrictions := v_new_overrides ? 'media' 
                                            AND jsonb_typeof(v_new_overrides->'media') = 'object'
                                            AND (SELECT count(*) FROM jsonb_object_keys(v_new_overrides->'media')) > 0;
                    
                v_new_has_module_restrictions := v_new_overrides ? 'modules' 
                                             AND jsonb_typeof(v_new_overrides->'modules') = 'object'
                                             AND (SELECT count(*) FROM jsonb_object_keys(v_new_overrides->'modules')) > 0;
                
                -- Check if this is a full access template (empty or minimal overrides)
                v_is_full_access := NOT (v_new_has_media_restrictions OR v_new_has_module_restrictions);
                
                v_debug_info := v_debug_info || jsonb_build_object(
                    'new_has_media_restrictions', v_new_has_media_restrictions,
                    'new_has_module_restrictions', v_new_has_module_restrictions,
                    'is_full_access', v_is_full_access
                );
                
                -- Check if user already has access to this content
                SELECT * INTO v_existing_access 
                FROM access.user_access ua
                WHERE ua.user_id = v_user_id 
                  AND ua.target_id = v_content_id
                  AND ua.type = 'content'
                LIMIT 1;
                
                v_debug_info := v_debug_info || jsonb_build_object(
                    'existing_access_found', FOUND
                );
                
                -- If user already has access to this content
                IF FOUND THEN
                    v_existing_overrides := v_existing_access.access_overrides;
                    
                    v_debug_info := v_debug_info || jsonb_build_object(
                        'existing_overrides', v_existing_overrides
                    );
                    
                    -- Check if existing access has restrictions
                    v_has_media_restrictions := v_existing_overrides ? 'media' 
                                            AND jsonb_typeof(v_existing_overrides->'media') = 'object'
                                            AND (SELECT count(*) FROM jsonb_object_keys(v_existing_overrides->'media')) > 0;
                    
                    v_has_module_restrictions := v_existing_overrides ? 'modules' 
                                             AND jsonb_typeof(v_existing_overrides->'modules') = 'object'
                                             AND (SELECT count(*) FROM jsonb_object_keys(v_existing_overrides->'modules')) > 0;
                    
                    v_existing_is_full_access := NOT (v_has_media_restrictions OR v_has_module_restrictions);
                    
                    v_debug_info := v_debug_info || jsonb_build_object(
                        'has_media_restrictions', v_has_media_restrictions,
                        'has_module_restrictions', v_has_module_restrictions,
                        'existing_is_full_access', v_existing_is_full_access
                    );
                    
                    -- Logic for determining whether to apply the new template:
                    -- 1. If existing access is full and new is full, preserve existing
                    -- 2. If existing has restrictions but new is full, upgrade to full
                    -- 3. If existing has restrictions and new doesn't have those specific restrictions, remove them
                    -- 4. If both have similar restrictions, preserve existing to maintain progress
                    
                    IF v_existing_is_full_access AND v_is_full_access THEN
                        -- Both are full access, preserve existing
                        v_should_apply := FALSE;
                        RAISE NOTICE 'User % already has full access to content %, preserving existing access', 
                            v_user_id, v_content_id;
                    ELSIF v_is_full_access AND NOT v_existing_is_full_access THEN
                        -- Upgrade to full access by removing all restrictions
                        v_final_overrides := '{}'::jsonb;
                        RAISE NOTICE 'Upgrading user % to full access for content %', 
                            v_user_id, v_content_id;
                    ELSIF v_has_media_restrictions AND NOT v_new_has_media_restrictions THEN
                        -- User has media restrictions but new template doesn't - remove them
                        -- Start with a clean slate for media
                        v_final_overrides := v_existing_overrides;
                        
                        -- If media restrictions should be removed completely
                        IF NOT v_new_has_media_restrictions THEN
                            v_final_overrides := v_final_overrides - 'media';
                            IF v_final_overrides IS NULL OR v_final_overrides = '{}'::jsonb THEN
                                v_final_overrides := '{}'::jsonb;
                            END IF;
                        END IF;
                        
                        -- If module restrictions should be removed completely
                        IF NOT v_new_has_module_restrictions AND v_has_module_restrictions THEN
                            v_final_overrides := v_final_overrides - 'modules';
                            IF v_final_overrides IS NULL OR v_final_overrides = '{}'::jsonb THEN
                                v_final_overrides := '{}'::jsonb;
                            END IF;
                        END IF;
                        
                        RAISE NOTICE 'Removing restrictions for user % on content % that are not in the new template', 
                            v_user_id, v_content_id;
                    ELSE
                        -- Both have similar restrictions - keep existing to preserve progress
                        v_final_overrides := v_existing_overrides;
                        v_should_apply := FALSE;
                        RAISE NOTICE 'User % already has access with similar restrictions to content %, preserving existing progress', 
                            v_user_id, v_content_id;
                    END IF;
                ELSE
                    -- No existing access, use new overrides as is
                    v_final_overrides := v_new_overrides;
                    RAISE NOTICE 'User % has no existing access to content %, granting new access', 
                        v_user_id, v_content_id;
                END IF;
                
                v_debug_info := v_debug_info || jsonb_build_object(
                    'should_apply', v_should_apply,
                    'final_overrides', v_final_overrides
                );
            END IF;
            
            -- For AI templates
            IF v_template.template_type = 'ai' THEN
                v_ai_target_id := (v_template.template_details->>'target_id')::UUID;
                -- For AI templates, we'll use an empty object for overrides since there's no access_level
                v_new_overrides := '{}'::jsonb;
                
                v_debug_info := v_debug_info || jsonb_build_object(
                    'ai_target_id', v_ai_target_id,
                    'new_overrides', v_new_overrides
                );
                
                -- Check if user already has access to this AI target
                SELECT * INTO v_existing_access 
                FROM access.user_access ua
                WHERE ua.user_id = v_user_id 
                  AND ua.target_id = v_ai_target_id
                  AND ua.type = 'ai'
                LIMIT 1;
                
                v_debug_info := v_debug_info || jsonb_build_object(
                    'existing_access_found', FOUND
                );
                
                -- If user already has access to this AI target
                IF FOUND THEN
                    -- For AI, we'll just preserve existing overrides if any
                    v_existing_overrides := v_existing_access.access_overrides;
                    v_final_overrides := v_existing_overrides;
                    v_should_apply := FALSE;
                    RAISE NOTICE 'User % already has AI access to target %, preserving existing settings', 
                        v_user_id, v_ai_target_id;
                        
                    v_debug_info := v_debug_info || jsonb_build_object(
                        'existing_overrides', v_existing_overrides,
                        'should_apply', v_should_apply
                    );
                ELSE
                    -- No existing access, use empty overrides
                    v_final_overrides := v_new_overrides;
                    RAISE NOTICE 'User % has no existing AI access to target %, granting new access', 
                        v_user_id, v_ai_target_id;
                        
                    v_debug_info := v_debug_info || jsonb_build_object(
                        'should_apply', v_should_apply,
                        'final_overrides', v_final_overrides
                    );
                END IF;
            END IF;
            
            -- Apply template if determined it should be applied
            IF v_should_apply THEN
                -- Apply content template
                IF v_template.template_type = 'content' THEN
                    -- Insert directly into user_access table
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
                        v_user_id,
                        v_content_id,
                        'content',
                        auth.uid(),
                        NOW(),
                        NOW(),
                        v_final_overrides
                    )
                    ON CONFLICT (user_id, target_id, type)
                    DO UPDATE SET
                        granted_by = auth.uid(),
                        granted_at = NOW(),
                        access_overrides = v_final_overrides;
                    
                    v_user_results := v_user_results || jsonb_build_object(
                        'type', 'content',
                        'template_id', v_template.template_id,
                        'content_id', v_content_id,
                        'action', 'applied',
                        'overrides', v_final_overrides,
                        'debug', v_debug_info
                    );
                END IF;

                -- Apply AI template
                IF v_template.template_type = 'ai' THEN
                    -- Insert directly into user_access table
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
                        v_user_id,
                        v_ai_target_id,
                        'ai',
                        auth.uid(),
                        NOW(),
                        NOW(),
                        v_final_overrides
                    )
                    ON CONFLICT (user_id, target_id, type)
                    DO UPDATE SET
                        granted_by = auth.uid(),
                        granted_at = NOW(),
                        access_overrides = v_final_overrides;
                    
                    v_user_results := v_user_results || jsonb_build_object(
                        'type', 'ai',
                        'template_id', v_template.template_id,
                        'target_id', v_ai_target_id,
                        'action', 'applied',
                        'overrides', v_final_overrides,
                        'debug', v_debug_info
                    );
                END IF;
            ELSE
                -- Record that we skipped this template
                v_user_results := v_user_results || jsonb_build_object(
                    'type', v_template.template_type,
                    'template_id', v_template.template_id,
                    'action', 'skipped',
                    'reason', 'existing_access_preserved',
                    'debug', v_debug_info
                );
            END IF;
        END LOOP;
        
        -- Add this user's results to the overall results
        v_all_results := v_all_results || jsonb_build_object(
            'user_id', v_user_id,
            'templates_applied', v_user_results
        );
    END LOOP;

    -- Return a JSON object with the count and detailed results
    RETURN jsonb_build_object(
        'count', v_count,
        'results', v_all_results
    );
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.grant_bundle_variation_access(UUID[], UUID) IS 'Grants access to a bundle variation for multiple users and directly applies all associated templates. Access control handled by RPC authorization.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.grant_bundle_variation_access(UUID[], UUID) TO authenticated;

-- Since we're now handling template application directly in the function,
-- we can drop the trigger and trigger function
DROP TRIGGER IF EXISTS apply_templates_on_access_grant ON access.bundle_variation_access;
DROP FUNCTION IF EXISTS access.apply_templates_on_access_grant(); 