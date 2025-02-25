-- Create function to save access bundle data
CREATE OR REPLACE FUNCTION public.save_access_bundle(
  p_bundle JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, access, auth
AS $$
DECLARE
  v_bundle_id UUID;
  v_variation_id UUID;
  v_result JSONB;
  v_variations_array JSONB;
  v_existing_bundle_id UUID;
  v_sql_state TEXT;
  v_sql_message TEXT;
  v_sql_context TEXT;
  v_templates_array JSONB;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Debug the input
  RAISE NOTICE 'Processing bundle: %', jsonb_pretty(p_bundle);
  
  -- Start a transaction
  BEGIN
    -- Step 1: Check if a bundle with this name already exists
    SELECT id INTO v_existing_bundle_id
    FROM access.bundles
    WHERE name = (p_bundle->>'name');
    
    -- If bundle ID is provided, use that instead
    IF (p_bundle->>'id') IS NOT NULL AND (p_bundle->>'id') != '' THEN
      v_existing_bundle_id := (p_bundle->>'id')::UUID;
    END IF;
    
    RAISE NOTICE 'Existing bundle ID: %', v_existing_bundle_id;
    
    -- Create or update the bundle
    IF v_existing_bundle_id IS NOT NULL THEN
      -- Update existing bundle
      UPDATE access.bundles 
      SET 
        name = (p_bundle->>'name'),
        description = COALESCE(p_bundle->>'description', ''),
        updated_at = NOW()
      WHERE id = v_existing_bundle_id
      RETURNING id INTO v_bundle_id;
      
      RAISE NOTICE 'Updated existing bundle with ID: %', v_bundle_id;
    ELSE
      -- Create new bundle
      INSERT INTO access.bundles (
        name,
        description,
        created_by
      ) VALUES (
        (p_bundle->>'name'),
        COALESCE(p_bundle->>'description', ''),
        auth.uid()
      )
      RETURNING id INTO v_bundle_id;
      
      RAISE NOTICE 'Created new bundle with ID: %', v_bundle_id;
    END IF;

    -- Initialize variations array for the result
    v_variations_array := '[]'::JSONB;

    -- Step 2: Process variations if they exist
    IF p_bundle->'variations' IS NOT NULL AND jsonb_array_length(p_bundle->'variations') > 0 THEN
      -- Process the first variation only for now
      DECLARE
        v_variation JSONB := p_bundle->'variations'->0;
        v_variation_name TEXT;
        v_variation_id_text TEXT := v_variation->>'id';
        v_existing_variation_id UUID;
      BEGIN
        -- Handle both "name" and "variation_name" fields, preferring "variation_name" if both exist
        IF v_variation->>'variation_name' IS NOT NULL AND v_variation->>'variation_name' != '' THEN
          v_variation_name := v_variation->>'variation_name';
        ELSE
          v_variation_name := v_variation->>'name';
        END IF;
        
        IF v_variation_name IS NULL OR v_variation_name = '' THEN
          RAISE EXCEPTION 'Variation name is required';
        END IF;
        
        RAISE NOTICE 'Processing variation: % (ID: %)', v_variation_name, v_variation_id_text;
        
        -- Check if this variation already exists
        IF v_variation_id_text IS NOT NULL AND v_variation_id_text != '' THEN
          SELECT id INTO v_existing_variation_id
          FROM access.bundle_variations
          WHERE id = v_variation_id_text::UUID;
        END IF;
        
        IF v_existing_variation_id IS NULL AND v_bundle_id IS NOT NULL THEN
          -- Check if a variation with this name exists for this bundle
          SELECT id INTO v_existing_variation_id
          FROM access.bundle_variations
          WHERE bundle_id = v_bundle_id AND variation_name = v_variation_name;
        END IF;
        
        RAISE NOTICE 'Existing variation ID: %', v_existing_variation_id;
        
        -- Create or update the variation
        IF v_existing_variation_id IS NOT NULL THEN
          -- Update existing variation
          BEGIN
            UPDATE access.bundle_variations
            SET 
              variation_name = v_variation_name,
              description = COALESCE(v_variation->>'description', ''),
              updated_at = NOW()
            WHERE id = v_existing_variation_id
            RETURNING id INTO v_variation_id;
            
            RAISE NOTICE 'Updated variation with ID: %', v_variation_id;
          EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS 
              v_sql_state = RETURNED_SQLSTATE,
              v_sql_message = MESSAGE_TEXT;
            
            RAISE EXCEPTION 'Error updating variation: %', v_sql_message;
          END;
        ELSE
          -- Create new variation
          BEGIN
            INSERT INTO access.bundle_variations (
              bundle_id,
              variation_name,
              description,
              created_by
            ) VALUES (
              v_bundle_id,
              v_variation_name,
              COALESCE(v_variation->>'description', ''),
              auth.uid()
            )
            RETURNING id INTO v_variation_id;
            
            RAISE NOTICE 'Created variation with ID: %', v_variation_id;
          EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS 
              v_sql_state = RETURNED_SQLSTATE,
              v_sql_message = MESSAGE_TEXT;
            
            RAISE EXCEPTION 'Error creating variation: %', v_sql_message;
          END;
        END IF;
        
        -- Step 3: Process templates if they exist for this variation
        IF v_variation_id IS NOT NULL AND v_variation->'templates' IS NOT NULL AND jsonb_array_length(v_variation->'templates') > 0 THEN
          -- Initialize templates array for the result
          v_templates_array := '[]'::JSONB;
          
          -- First, clear existing template links for this variation
          DELETE FROM access.bundle_templates
          WHERE bundle_variation_id = v_variation_id;
          
          RAISE NOTICE 'Cleared existing template links for variation ID: %', v_variation_id;
          
          -- Process each template
          FOR i IN 0..jsonb_array_length(v_variation->'templates')-1 LOOP
            DECLARE
              v_template JSONB := v_variation->'templates'->i;
              v_template_id TEXT := v_template->>'id';
              v_template_type TEXT := v_template->>'type';
              v_template_name TEXT := v_template->>'name';
              v_content_id TEXT := v_template->>'contentId';
              v_bundle_template_id UUID;
              v_link_exists BOOLEAN;
              v_template_data JSONB := NULL;
              v_ai_level TEXT := NULL;
              v_ai_template_exists BOOLEAN := FALSE;
              v_ai_template_id UUID := NULL;
              v_template_exists BOOLEAN;
            BEGIN
              RAISE NOTICE 'Processing template: % (ID: %, Type: %, ContentID: %)', 
                v_template_name, v_template_id, v_template_type, v_content_id;
              
              -- Handle Content Templates (which always already exist)
              IF v_template_type = 'content' THEN
                -- Skip if template ID is missing for content templates
                IF v_template_id IS NULL OR v_template_id = '' THEN
                  RAISE NOTICE 'Skipping content template with missing ID';
                  CONTINUE;
                END IF;
                
                -- Verify the content template exists
                SELECT EXISTS (
                  SELECT 1 FROM access.content_templates
                  WHERE id = v_template_id::UUID
                ) INTO v_template_exists;
                
                IF NOT v_template_exists THEN
                  RAISE EXCEPTION 'Content template with ID % does not exist', v_template_id;
                END IF;
                
                -- Store content template data for results only (not for database)
                v_template_data := jsonb_build_object(
                  'contentId', v_content_id,
                  'contentName', v_template->>'contentName'
                );
                
                -- Link the content template
                INSERT INTO access.bundle_templates (
                  bundle_variation_id,
                  template_id,
                  template_type,
                  created_by
                ) VALUES (
                  v_variation_id,
                  v_template_id::UUID,
                  'content',
                  auth.uid()
                )
                RETURNING id INTO v_bundle_template_id;
                
                RAISE NOTICE 'Linked content template % to variation %', v_template_id, v_variation_id;
                
                -- Add to templates array for the result
                v_templates_array := v_templates_array || jsonb_build_object(
                  'id', v_template_id,
                  'type', 'content',
                  'name', v_template_name,
                  'contentId', v_content_id,
                  'contentName', v_template->>'contentName'
                );
              
              -- Handle AI Templates (which may need to be created)
              ELSIF v_template_type = 'ai' THEN
                -- Determine the AI template level (category, suite, or tool)
                IF v_template->'toolIds' IS NOT NULL AND jsonb_array_length(v_template->'toolIds') > 0 THEN
                  v_ai_level := 'tool';
                ELSIF v_template->>'suiteId' IS NOT NULL AND v_template->>'suiteId' != '' THEN
                  v_ai_level := 'suite';
                ELSIF v_template->>'categoryId' IS NOT NULL AND v_template->>'categoryId' != '' THEN
                  v_ai_level := 'category';
                ELSE
                  RAISE NOTICE 'AI template missing required IDs, skipping';
                  CONTINUE;
                END IF;
                
                RAISE NOTICE 'AI template level: %', v_ai_level;
                
                -- Process based on AI level
                IF v_ai_level = 'category' THEN
                  -- Store category metadata for results only (not for database)
                  v_template_data := jsonb_build_object(
                    'level', 'category',
                    'categoryId', v_template->>'categoryId',
                    'categoryName', v_template->>'categoryName'
                  );
                  
                  -- Use existing AI template or create a new one
                  IF v_template_id IS NOT NULL AND v_template_id != '' THEN
                    -- Check if the specified template exists
                    SELECT EXISTS (
                      SELECT 1 FROM access.ai_templates
                      WHERE id = v_template_id::UUID
                    ) INTO v_ai_template_exists;
                    
                    IF v_ai_template_exists THEN
                      v_ai_template_id := v_template_id::UUID;
                    ELSE
                      -- Create new template with specified ID
                      INSERT INTO access.ai_templates (
                        id,
                        target_id,
                        bundle_variation_id,
                        created_by
                      ) VALUES (
                        v_template_id::UUID,
                        (v_template->>'categoryId')::UUID,
                        v_variation_id,
                        auth.uid()
                      )
                      RETURNING id INTO v_ai_template_id;
                    END IF;
                  ELSE
                    -- Check if a template for this target already exists
                    SELECT id INTO v_ai_template_id
                    FROM access.ai_templates
                    WHERE target_id = (v_template->>'categoryId')::UUID
                    AND (bundle_variation_id IS NULL OR bundle_variation_id = v_variation_id)
                    ORDER BY created_at DESC
                    LIMIT 1;
                    
                    IF v_ai_template_id IS NULL THEN
                      -- Create a new template
                      INSERT INTO access.ai_templates (
                        target_id,
                        bundle_variation_id,
                        created_by
                      ) VALUES (
                        (v_template->>'categoryId')::UUID,
                        v_variation_id,
                        auth.uid()
                      )
                      RETURNING id INTO v_ai_template_id;
                    END IF;
                  END IF;
                  
                ELSIF v_ai_level = 'suite' THEN
                  -- Store suite metadata for results only (not for database)
                  v_template_data := jsonb_build_object(
                    'level', 'suite',
                    'categoryId', v_template->>'categoryId',
                    'categoryName', v_template->>'categoryName',
                    'suiteId', v_template->>'suiteId',
                    'suiteName', v_template->>'suiteName'
                  );
                  
                  -- Use existing AI template or create a new one
                  IF v_template_id IS NOT NULL AND v_template_id != '' THEN
                    -- Check if the specified template exists
                    SELECT EXISTS (
                      SELECT 1 FROM access.ai_templates
                      WHERE id = v_template_id::UUID
                    ) INTO v_ai_template_exists;
                    
                    IF v_ai_template_exists THEN
                      v_ai_template_id := v_template_id::UUID;
                    ELSE
                      -- Create new template with specified ID
                      INSERT INTO access.ai_templates (
                        id,
                        target_id,
                        bundle_variation_id,
                        created_by
                      ) VALUES (
                        v_template_id::UUID,
                        (v_template->>'suiteId')::UUID,
                        v_variation_id,
                        auth.uid()
                      )
                      RETURNING id INTO v_ai_template_id;
                    END IF;
                  ELSE
                    -- Check if a template for this target already exists
                    SELECT id INTO v_ai_template_id
                    FROM access.ai_templates
                    WHERE target_id = (v_template->>'suiteId')::UUID
                    AND (bundle_variation_id IS NULL OR bundle_variation_id = v_variation_id)
                    ORDER BY created_at DESC
                    LIMIT 1;
                    
                    IF v_ai_template_id IS NULL THEN
                      -- Create a new template
                      INSERT INTO access.ai_templates (
                        target_id,
                        bundle_variation_id,
                        created_by
                      ) VALUES (
                        (v_template->>'suiteId')::UUID,
                        v_variation_id,
                        auth.uid()
                      )
                      RETURNING id INTO v_ai_template_id;
                    END IF;
                  END IF;
                  
                ELSIF v_ai_level = 'tool' THEN
                  -- Process each tool individually
                  FOR j IN 0..jsonb_array_length(v_template->'toolIds')-1 LOOP
                    DECLARE
                      v_tool_id_raw JSONB := v_template->'toolIds'->j;
                      v_tool_id TEXT;
                      v_tool_name TEXT;
                      v_tool_template_id UUID;
                      v_tool_template_data JSONB;
                      v_tool_bundle_template_id UUID;
                    BEGIN
                      -- Extract the tool ID properly as text and remove any extra quotes
                      IF jsonb_typeof(v_tool_id_raw) = 'string' THEN
                        v_tool_id := v_tool_id_raw#>>'{}';
                      ELSE
                        v_tool_id := v_tool_id_raw::TEXT;
                      END IF;
                      
                      -- Get the tool name
                      IF j < jsonb_array_length(v_template->'toolNames') THEN
                        v_tool_name := v_template->'toolNames'->j#>>'{}';
                      ELSE
                        v_tool_name := 'Unknown Tool';
                      END IF;
                      
                      RAISE NOTICE 'Processing tool: ID=%, Name=%', v_tool_id, v_tool_name;
                      
                      -- Store tool-specific metadata for results only
                      v_tool_template_data := jsonb_build_object(
                        'level', 'tool',
                        'categoryId', v_template->>'categoryId',
                        'categoryName', v_template->>'categoryName',
                        'suiteId', v_template->>'suiteId',
                        'suiteName', v_template->>'suiteName',
                        'toolIds', jsonb_build_array(v_tool_id),
                        'toolNames', jsonb_build_array(v_tool_name)
                      );
                      
                      -- Check if a template for this tool already exists
                      BEGIN
                        SELECT id INTO v_tool_template_id
                        FROM access.ai_templates
                        WHERE target_id = v_tool_id::UUID
                        AND (bundle_variation_id IS NULL OR bundle_variation_id = v_variation_id)
                        ORDER BY created_at DESC
                        LIMIT 1;
                        
                        IF v_tool_template_id IS NULL THEN
                          -- Create a new AI template for this tool
                          INSERT INTO access.ai_templates (
                            target_id,
                            bundle_variation_id,
                            created_by
                          ) VALUES (
                            v_tool_id::UUID,
                            v_variation_id,
                            auth.uid()
                          )
                          RETURNING id INTO v_tool_template_id;
                        END IF;
                        
                        -- Link this tool to the variation
                        INSERT INTO access.bundle_templates (
                          bundle_variation_id,
                          template_id,
                          template_type,
                          created_by
                        ) VALUES (
                          v_variation_id,
                          v_tool_template_id,
                          'ai',
                          auth.uid()
                        )
                        RETURNING id INTO v_tool_bundle_template_id;
                        
                        -- If this is the first tool, save its ID for the results
                        IF j = 0 THEN
                          v_ai_template_id := v_tool_template_id;
                          v_template_data := v_tool_template_data;
                        END IF;
                        
                        RAISE NOTICE 'Linked tool template % to variation %', v_tool_template_id, v_variation_id;
                      EXCEPTION WHEN OTHERS THEN
                        GET STACKED DIAGNOSTICS 
                          v_sql_state = RETURNED_SQLSTATE,
                          v_sql_message = MESSAGE_TEXT;
                        
                        RAISE NOTICE 'Error processing tool %: % (SQLSTATE: %)', v_tool_id, v_sql_message, v_sql_state;
                        -- Continue with next tool rather than failing everything
                        CONTINUE;
                      END;
                    END;
                  END LOOP;
                  
                  -- Skip the default linking below if we're processing tools
                  -- since we already linked each tool individually
                  IF v_ai_template_id IS NOT NULL THEN
                    -- Add to templates array for the result
                    v_templates_array := v_templates_array || jsonb_build_object(
                      'id', v_ai_template_id,
                      'type', 'ai',
                      'name', v_template_name,
                      'level', v_ai_level,
                      'categoryId', v_template->>'categoryId',
                      'categoryName', v_template->>'categoryName',
                      'suiteId', v_template->>'suiteId',
                      'suiteName', v_template->>'suiteName',
                      'toolIds', v_template->'toolIds',
                      'toolNames', v_template->'toolNames'
                    );
                  END IF;
                  
                  -- Continue to the next template
                  CONTINUE;
                END IF;
                
                -- Link the AI template (except for 'tool' level which is already linked)
                IF v_ai_template_id IS NOT NULL THEN
                  INSERT INTO access.bundle_templates (
                    bundle_variation_id,
                    template_id,
                    template_type,
                    created_by
                  ) VALUES (
                    v_variation_id,
                    v_ai_template_id,
                    'ai',
                    auth.uid()
                  )
                  RETURNING id INTO v_bundle_template_id;
                  
                  RAISE NOTICE 'Linked AI template % to variation %', v_ai_template_id, v_variation_id;
                  
                  -- Add to templates array for the result
                  v_templates_array := v_templates_array || jsonb_build_object(
                    'id', v_ai_template_id,
                    'type', 'ai',
                    'name', v_template_name,
                    'level', v_ai_level,
                    'categoryId', v_template->>'categoryId',
                    'categoryName', v_template->>'categoryName',
                    'suiteId', v_template->>'suiteId',
                    'suiteName', v_template->>'suiteName',
                    'toolIds', v_template->'toolIds',
                    'toolNames', v_template->'toolNames'
                  );
                END IF;
              END IF;
            EXCEPTION WHEN OTHERS THEN
              GET STACKED DIAGNOSTICS 
                v_sql_state = RETURNED_SQLSTATE,
                v_sql_message = MESSAGE_TEXT;
              
              RAISE EXCEPTION 'Error processing template: % (SQLSTATE: %)', v_sql_message, v_sql_state;
            END;
          END LOOP;
        END IF;
        
        -- Add to variations array for the result
        IF v_variation_id IS NOT NULL THEN
          v_variations_array := jsonb_build_array(
            jsonb_build_object(
              'id', v_variation_id,
              'name', v_variation_name,
              'description', COALESCE(v_variation->>'description', ''),
              'templates', COALESCE(v_templates_array, '[]'::JSONB)
            )
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS 
          v_sql_state = RETURNED_SQLSTATE,
          v_sql_message = MESSAGE_TEXT,
          v_sql_context = PG_EXCEPTION_CONTEXT;
        
        RAISE EXCEPTION 'Error processing variation: % (SQLSTATE: %, Context: %)', 
          v_sql_message, v_sql_state, v_sql_context;
      END;
    END IF;

    -- Build the result
    v_result := jsonb_build_object(
      'id', v_bundle_id,
      'name', p_bundle->>'name',
      'description', COALESCE(p_bundle->>'description', ''),
      'variations', v_variations_array,
      'success', true
    );
    
    -- Return the result
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    GET STACKED DIAGNOSTICS 
      v_sql_state = RETURNED_SQLSTATE,
      v_sql_message = MESSAGE_TEXT,
      v_sql_context = PG_EXCEPTION_CONTEXT;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', v_sql_message,
      'state', v_sql_state,
      'context', v_sql_context
    );
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_access_bundle(JSONB) TO PUBLIC;

-- Add helpful comment
COMMENT ON FUNCTION public.save_access_bundle(JSONB) IS 'Saves access bundle data with variations and links to existing templates (both content and AI) through bundle_templates table. For AI templates, handles different levels (category, suite, tool) appropriately. Accepts both "name" and "variation_name" fields for variations.'; 