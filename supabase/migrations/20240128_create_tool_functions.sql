-- Create a function to get tools by slug
create or replace function public.get_tool_by_slug(slug text)
returns setof ai.tools
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.tools 
  where lower(title) = lower(regexp_replace(slug, '-', ' ', 'g'))
  or id = (
    select id from ai.tools 
    where lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) = lower(slug)
  );
$$;

-- Create a function to get tool by ID
create or replace function public.get_tool_by_id(tool_id uuid)
returns setof ai.tools
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.tools where id = tool_id;
$$;

-- Create a function to get tool inputs
create or replace function public.get_tool_inputs(tool_id uuid)
returns setof ai.inputs
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.inputs 
  where tool_id = $1 
  order by created_at asc;
$$;

-- Drop existing prompts function
drop function if exists public.get_tool_prompts(uuid);

-- Create a function to get tool prompts
create or replace function public.get_tool_prompts(tool_id uuid)
returns setof ai.prompts
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.prompts 
  where tool_id = $1 
  order by prompt_order asc;
$$;

-- Create a function to list all tools
create or replace function public.list_tools()
returns setof ai.tools
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.tools
  order by created_at desc;
$$;

-- Create a function to list collections
create or replace function public.list_collections()
returns setof ai.collections
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.collections
  order by created_at desc;
$$;

-- Create a function to get suites by collection
create or replace function public.get_suites_by_collection(collection_id uuid)
returns setof ai.suites
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.suites
  where collection_id = $1
  order by created_at desc;
$$;

-- Create a function to get tools by suite
create or replace function public.get_tools_by_suite(suite_id uuid)
returns setof ai.tools
language sql
security definer
set search_path = public
stable
as $$
  select * from ai.tools
  where suite_id = $1
  order by created_at desc;
$$;

-- Grant access to public
grant execute on function public.get_tool_by_slug(text) to public;
grant execute on function public.get_tool_by_id(uuid) to public;
grant execute on function public.get_tool_inputs(uuid) to public;
grant execute on function public.get_tool_prompts(uuid) to public;
grant execute on function public.list_tools() to public;
grant execute on function public.list_collections() to public;
grant execute on function public.get_suites_by_collection(uuid) to public;
grant execute on function public.get_tools_by_suite(uuid) to public; 