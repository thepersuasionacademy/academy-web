-- Function to create a bundle with variations and templates
CREATE OR REPLACE FUNCTION access.create_bundle(
    p_bundle_name TEXT,
    p_bundle_description TEXT,
    p_variations JSONB -- Array of variations with their templates
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bundle_id UUID;
    v_variation JSONB;
    v_variation_id UUID;
    v_template JSONB;
    v_result JSONB;
BEGIN
    -- Create the bundle
    INSERT INTO access.bundles (name, description, created_by)
    VALUES (p_bundle_name, p_bundle_description, auth.uid())
    RETURNING id INTO v_bundle_id;

    -- Create variations and their templates
    FOR v_variation IN SELECT * FROM jsonb_array_elements(p_variations)
    LOOP
        -- Create variation
        INSERT INTO access.bundle_variations (
            bundle_id,
            variation_name,
            description,
            created_by
        )
        VALUES (
            v_bundle_id,
            v_variation->>'name',
            v_variation->>'description',
            auth.uid()
        )
        RETURNING id INTO v_variation_id;

        -- Add templates to variation
        FOR v_template IN SELECT * FROM jsonb_array_elements(v_variation->'templates')
        LOOP
            INSERT INTO access.bundle_templates (
                bundle_variation_id,
                template_type,
                template_id,
                created_by
            )
            VALUES (
                v_variation_id,
                v_template->>'type',
                (v_template->>'id')::UUID,
                auth.uid()
            );
        END LOOP;
    END LOOP;

    -- Return the created bundle structure
    SELECT jsonb_build_object(
        'bundle_id', bundle_id,
        'bundle_name', bundle_name,
        'variations', jsonb_agg(
            jsonb_build_object(
                'variation_id', variation_id,
                'variation_name', variation_name,
                'templates', templates
            )
        )
    )
    INTO v_result
    FROM access.bundle_structure
    WHERE bundle_id = v_bundle_id
    GROUP BY bundle_id, bundle_name;

    RETURN v_result;
END;
$$;

-- Function to apply a bundle variation to a user
CREATE OR REPLACE FUNCTION access.apply_bundle_variation(
    p_user_id UUID,
    p_variation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template RECORD;
    v_result JSONB := '[]'::JSONB;
    v_content_result JSONB;
    v_ai_result JSONB;
BEGIN
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
                        'access_level', at.access_level,
                        'target_id', at.target_id
                    )
            END as template_details
        FROM access.bundle_templates bt
        LEFT JOIN access.content_templates ct ON bt.template_type = 'content' AND bt.template_id = ct.id
        LEFT JOIN access.ai_templates at ON bt.template_type = 'ai' AND bt.template_id = at.id
        WHERE bt.bundle_variation_id = p_variation_id
    )
    LOOP
        -- Apply content template
        IF v_template.template_type = 'content' THEN
            SELECT public.grant_user_access(
                p_user_id,
                jsonb_build_object(
                    'content_id', (v_template.template_details->>'content_id')::UUID,
                    'overrides', v_template.template_details->'access_overrides'
                ),
                auth.uid()
            ) INTO v_content_result;
            
            v_result := v_result || jsonb_build_object(
                'type', 'content',
                'template_id', v_template.template_id,
                'result', v_content_result
            );
        END IF;

        -- Apply AI template
        IF v_template.template_type = 'ai' THEN
            -- Call AI access grant function (to be implemented)
            -- This would be similar to the content access grant
            v_result := v_result || jsonb_build_object(
                'type', 'ai',
                'template_id', v_template.template_id,
                'details', v_template.template_details
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'user_id', p_user_id,
        'variation_id', p_variation_id,
        'applied_templates', v_result
    );
END;
$$;

-- Function to get bundle details
CREATE OR REPLACE FUNCTION access.get_bundle_details(p_bundle_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT jsonb_build_object(
        'bundle_id', bundle_id,
        'bundle_name', bundle_name,
        'variations', jsonb_agg(
            jsonb_build_object(
                'variation_id', variation_id,
                'variation_name', variation_name,
                'templates', templates
            )
        )
    )
    FROM access.bundle_structure
    WHERE bundle_id = p_bundle_id
    GROUP BY bundle_id, bundle_name;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION access.create_bundle(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION access.apply_bundle_variation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION access.get_bundle_details(UUID) TO authenticated; 