-- Create a function to get AI tool details
CREATE OR REPLACE FUNCTION public.get_ai_tool_details(p_tool_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ai, auth
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'description', t.description,
        'credits_cost', t.credits_cost,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'suite', CASE 
            WHEN t.suite_id IS NOT NULL THEN
                jsonb_build_object(
                    'id', s.id,
                    'title', s.title,
                    'collection_id', s.collection_id,
                    'created_at', s.created_at,
                    'updated_at', s.updated_at,
                    'collection', CASE 
                        WHEN s.collection_id IS NOT NULL THEN
                            jsonb_build_object(
                                'id', c.id,
                                'title', c.title,
                                'created_at', c.created_at,
                                'updated_at', c.updated_at
                            )
                        ELSE NULL
                    END
                )
            ELSE NULL
        END
    ) INTO v_result
    FROM ai.tools t
    LEFT JOIN ai.suites s ON s.id = t.suite_id
    LEFT JOIN ai.collections c ON c.id = s.collection_id
    WHERE t.id = p_tool_id;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_ai_tool_details(UUID) TO authenticated; 