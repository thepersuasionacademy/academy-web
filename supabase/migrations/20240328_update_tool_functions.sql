-- Create a function to create a new collection
create or replace function public.create_collection(
  title text
)
returns ai.collections
language plpgsql
security definer
set search_path = public
as $$
declare
  new_collection ai.collections;
begin
  insert into ai.collections (title)
  values (title)
  returning * into new_collection;
  
  return new_collection;
end;
$$;

-- Create a function to create a new suite
create or replace function public.create_suite(
  collection_id uuid,
  title text
)
returns ai.suites
language plpgsql
security definer
set search_path = public
as $$
declare
  new_suite ai.suites;
begin
  insert into ai.suites (collection_id, title)
  values (collection_id, title)
  returning * into new_suite;
  
  return new_suite;
end;
$$;

-- Create a function to create a new tool
create or replace function public.create_tool(
  suite_id uuid,
  title text,
  description text,
  credits_cost numeric
)
returns ai.tools
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tool ai.tools;
begin
  insert into ai.tools (suite_id, title, description, credits_cost)
  values (suite_id, title, description, credits_cost)
  returning * into new_tool;
  
  return new_tool;
end;
$$;

-- Create a function to duplicate a tool
create or replace function public.duplicate_tool(
  tool_id uuid
)
returns ai.tools
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tool ai.tools;
begin
  insert into ai.tools (
    suite_id,
    title,
    description,
    credits_cost
  )
  select 
    suite_id,
    title || ' (Copy)',
    description,
    credits_cost
  from ai.tools
  where id = tool_id
  returning * into new_tool;
  
  return new_tool;
end;
$$;

-- Grant access to public
grant execute on function public.create_collection(text) to public;
grant execute on function public.create_suite(uuid, text) to public;
grant execute on function public.create_tool(uuid, text, text, numeric) to public;
grant execute on function public.duplicate_tool(uuid) to public; 