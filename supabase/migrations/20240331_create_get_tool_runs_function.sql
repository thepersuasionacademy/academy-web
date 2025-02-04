-- Drop existing function if it exists
drop function if exists public.get_user_tool_runs(uuid, int);

-- Create a function to get user's tool runs
create or replace function public.get_user_tool_runs(
  p_user_id uuid,
  p_limit int default 10
)
returns table (
  id uuid,
  tool_name text,
  collection_name text,
  suite_name text,
  created_at timestamptz,
  credits_cost int,
  credits_before int,
  credits_after int,
  ai_response text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    tr.id,
    tr.tool_name,
    tr.collection_name,
    tr.suite_name,
    tr.created_at,
    tr.credits_cost,
    tr.credits_before,
    tr.credits_after,
    tr.ai_response
  from tool_runs tr
  where tr.user_id = p_user_id
  order by tr.created_at desc
  limit p_limit;
end;
$$; 