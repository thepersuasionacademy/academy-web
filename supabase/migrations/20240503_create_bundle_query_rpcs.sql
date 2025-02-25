-- Function to get basic bundle information for card display
CREATE OR REPLACE FUNCTION public.get_access_bundle_cards()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
DECLARE
  v_bundles JSONB;
BEGIN
  WITH bundle_data AS (
    -- Get all bundles with their variations
    SELECT 
      b.id AS bundle_id,
      b.name AS bundle_name,
      b.description,
      b.created_at,
      b.updated_at,
      b.created_by,
      jsonb_agg(
        jsonb_build_object(
          'id', bv.id,
          'name', bv.variation_name,
          'description', bv.description
        ) ORDER BY bv.variation_name
      ) AS variations
    FROM access.bundles b
    LEFT JOIN access.bundle_variations bv ON b.id = bv.bundle_id
    GROUP BY b.id, b.name, b.description, b.created_at, b.updated_at, b.created_by
    ORDER BY b.created_at DESC
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', bundle_id,
      'name', bundle_name,
      'description', description,
      'createdAt', created_at,
      'updatedAt', updated_at,
      'createdBy', created_by,
      'variations', variations
    )
  ) INTO v_bundles
  FROM bundle_data;

  -- Handle the case when no bundles are found
  IF v_bundles IS NULL THEN
    v_bundles := '[]'::JSONB;
  END IF;

  RETURN jsonb_build_object(
    'bundles', v_bundles,
    'success', true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Function to get detailed information about a specific bundle variation and its templates
CREATE OR REPLACE FUNCTION public.get_access_bundle_variation_details(
  p_bundle_id UUID,
  p_variation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
DECLARE
  v_bundle JSONB;
  v_variations JSONB;
  v_selected_variation_id UUID := p_variation_id;
  v_templates JSONB;
  v_content_templates JSONB;
  v_ai_templates JSONB;
BEGIN
  -- Get basic bundle information
  SELECT jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'description', b.description,
    'createdAt', b.created_at,
    'updatedAt', b.updated_at,
    'createdBy', b.created_by
  ) INTO v_bundle
  FROM access.bundles b
  WHERE b.id = p_bundle_id;
  
  -- If bundle doesn't exist, return error
  IF v_bundle IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bundle not found',
      'code', 'NOT_FOUND'
    );
  END IF;
  
  -- Get all variations for this bundle
  WITH variation_data AS (
    SELECT 
      bv.id,
      bv.variation_name,
      bv.description,
      bv.created_at,
      bv.updated_at,
      COUNT(bt.id) AS template_count
    FROM access.bundle_variations bv
    LEFT JOIN access.bundle_templates bt ON bv.id = bt.bundle_variation_id
    WHERE bv.bundle_id = p_bundle_id
    GROUP BY bv.id, bv.variation_name, bv.description, bv.created_at, bv.updated_at
    ORDER BY bv.variation_name
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', variation_name,
      'description', description,
      'createdAt', created_at,
      'updatedAt', updated_at,
      'templateCount', template_count
    )
  ) INTO v_variations
  FROM variation_data;
  
  -- Handle the case when no variations are found
  IF v_variations IS NULL THEN
    v_variations := '[]'::JSONB;
  END IF;
  
  -- If no variation ID is provided, use the first one if available
  IF v_selected_variation_id IS NULL AND jsonb_array_length(v_variations) > 0 THEN
    v_selected_variation_id := (v_variations->0->>'id')::UUID;
  END IF;
  
  -- Get templates for the selected variation if there is one
  IF v_selected_variation_id IS NOT NULL THEN
    -- Get Content Templates
    WITH content_templates AS (
      SELECT 
        bt.id AS bundle_template_id,
        bt.template_id,
        bt.template_type,
        ct.name AS template_name,
        ct.content_id,
        c.title AS content_name,
        c.description AS content_description
      FROM access.bundle_templates bt
      JOIN access.content_templates ct ON bt.template_id = ct.id
      LEFT JOIN content.content c ON ct.content_id = c.id
      WHERE bt.bundle_variation_id = v_selected_variation_id
      AND bt.template_type = 'content'
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', template_id,
        'type', template_type,
        'name', template_name,
        'contentId', content_id,
        'contentName', content_name,
        'description', content_description
      )
    ) INTO v_content_templates
    FROM content_templates;
    
    -- Get AI Templates
    WITH ai_templates AS (
      SELECT 
        bt.id AS bundle_template_id,
        bt.template_id,
        bt.template_type,
        at.target_id,
        
        -- We need to determine the level (category, suite, tool)
        CASE
          WHEN aic.id IS NOT NULL THEN 'category'
          WHEN ais.id IS NOT NULL THEN 'suite'
          WHEN ait.id IS NOT NULL THEN 'tool'
          ELSE NULL
        END AS level,
        
        -- Get category info if this target is a category or has a parent category
        aic.id AS category_id,
        aic.name AS category_name,
        
        -- Get suite info if this target is a suite or has a parent suite
        ais.id AS suite_id,
        ais.name AS suite_name,
        ais.category_id AS suite_category_id,
        aic_suite.name AS suite_category_name,
        
        -- Get tool info if this target is a tool
        ait.id AS tool_id,
        ait.name AS tool_name,
        ait.suite_id AS tool_suite_id,
        ais_tool.name AS tool_suite_name,
        ais_tool.category_id AS tool_category_id,
        aic_tool.name AS tool_category_name
        
      FROM access.bundle_templates bt
      JOIN access.ai_templates at ON bt.template_id = at.id
      
      -- Try to match as category
      LEFT JOIN ai.categories aic ON at.target_id = aic.id
      
      -- Try to match as suite
      LEFT JOIN ai.suites ais ON at.target_id = ais.id
      LEFT JOIN ai.categories aic_suite ON ais.category_id = aic_suite.id
      
      -- Try to match as tool
      LEFT JOIN ai.tools ait ON at.target_id = ait.id
      LEFT JOIN ai.suites ais_tool ON ait.suite_id = ais_tool.id
      LEFT JOIN ai.categories aic_tool ON ais_tool.category_id = aic_tool.id
      
      WHERE bt.bundle_variation_id = v_selected_variation_id
      AND bt.template_type = 'ai'
    )
    SELECT jsonb_agg(
      CASE
        -- Category level
        WHEN level = 'category' THEN
          jsonb_build_object(
            'id', template_id,
            'type', template_type,
            'name', category_name,
            'level', 'category',
            'categoryId', category_id,
            'categoryName', category_name
          )
        
        -- Suite level
        WHEN level = 'suite' THEN
          jsonb_build_object(
            'id', template_id,
            'type', template_type,
            'name', suite_name,
            'level', 'suite',
            'categoryId', suite_category_id,
            'categoryName', suite_category_name,
            'suiteId', suite_id,
            'suiteName', suite_name
          )
        
        -- Tool level
        WHEN level = 'tool' THEN
          jsonb_build_object(
            'id', template_id,
            'type', template_type,
            'name', tool_name,
            'level', 'tool',
            'categoryId', tool_category_id,
            'categoryName', tool_category_name,
            'suiteId', tool_suite_id,
            'suiteName', tool_suite_name,
            'toolIds', jsonb_build_array(tool_id),
            'toolNames', jsonb_build_array(tool_name)
          )
          
        ELSE
          jsonb_build_object(
            'id', template_id,
            'type', template_type,
            'name', 'Unknown AI Template',
            'targetId', target_id
          )
      END
    ) INTO v_ai_templates
    FROM ai_templates;
    
    -- Handle null template arrays
    IF v_content_templates IS NULL THEN
      v_content_templates := '[]'::JSONB;
    END IF;
    
    IF v_ai_templates IS NULL THEN
      v_ai_templates := '[]'::JSONB;
    END IF;
    
    -- Combine all templates
    v_templates := v_content_templates || v_ai_templates;
  ELSE
    v_templates := '[]'::JSONB;
  END IF;
  
  -- Return the bundled data
  RETURN jsonb_build_object(
    'bundle', v_bundle,
    'variations', v_variations,
    'selectedVariation', v_selected_variation_id,
    'templates', v_templates,
    'success', true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'code', SQLSTATE
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_access_bundle_cards() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_access_bundle_variation_details(UUID, UUID) TO PUBLIC;

-- Add helpful comments
COMMENT ON FUNCTION public.get_access_bundle_cards() IS 'Returns a list of access bundles with their basic information and variation names for card display';
COMMENT ON FUNCTION public.get_access_bundle_variation_details(UUID, UUID) IS 'Returns detailed information about a specific bundle and variation, including template data'; 