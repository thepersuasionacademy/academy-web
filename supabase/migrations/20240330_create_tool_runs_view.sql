-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create a view in the public schema that points to credits.tool_runs
CREATE OR REPLACE VIEW public.tool_runs AS
  SELECT * FROM credits.tool_runs;

-- Grant access to the view
GRANT SELECT, INSERT ON public.tool_runs TO authenticated;

-- Grant usage on credits schema
GRANT USAGE ON SCHEMA credits TO authenticated;

-- Grant access to the underlying table
GRANT SELECT, INSERT ON credits.tool_runs TO authenticated;

-- Create policy for the view
ALTER VIEW public.tool_runs OWNER TO authenticated; 