-- Drop the existing function first
drop function if exists public.get_tool_by_slug(text);

-- Update the get_tool_by_slug function to include collection and suite titles
create or replace function public.get_tool_by_slug(slug text)
returns table (
  id uuid,
  suite_id uuid,
  title text,
  description text,
  credits_cost integer,
  created_at timestamptz,
  updated_at timestamptz,
  collection_title text,
  suite_title text
)
language sql
security definer
set search_path = public
stable
as $$
  select 
    t.id,
    t.suite_id,
    t.title,
    t.description,
    t.credits_cost,
    t.created_at,
    t.updated_at,
    c.title as collection_title,
    s.title as suite_title
  from ai.tools t
  left join ai.suites s on t.suite_id = s.id
  left join ai.collections c on s.collection_id = c.id
  where lower(t.title) = lower(regexp_replace(slug, '-', ' ', 'g'))
  or t.id = (
    select id from ai.tools 
    where lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')) = lower(slug)
  );
$$;

-- Grant access to public
grant execute on function public.get_tool_by_slug(text) to public; 