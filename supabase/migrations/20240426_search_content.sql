-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.search_content(p_search_query text);

-- Create the search function
CREATE OR REPLACE FUNCTION public.search_content(p_search_query text)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    collection_id uuid,
    thumbnail_url text,
    status content.status_type,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.collection_id,
        c.thumbnail_url,
        c.status,
        c.created_at,
        c.updated_at
    FROM content.content c
    WHERE 
        c.title ILIKE '%' || p_search_query || '%'
        OR c.description ILIKE '%' || p_search_query || '%'
    ORDER BY 
        CASE 
            WHEN c.title ILIKE p_search_query || '%' THEN 0  -- Exact start match
            WHEN c.title ILIKE '%' || p_search_query || '%' THEN 1  -- Contains match
            ELSE 2  -- Description match
        END,
        c.title;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.search_content(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_content(text) TO service_role;

-- Add comment to the function
COMMENT ON FUNCTION public.search_content(text) IS 'Searches content by title or description, with prioritized matching'; 