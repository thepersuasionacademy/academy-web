-- Create enum for tool status
create type ai.tool_status as enum ('draft', 'published', 'archived', 'maintenance');

-- Add status column to tools table
alter table ai.tools 
add column status ai.tool_status not null default 'draft';

-- Update the get_tool_with_permissions function to use the new status column
create or replace function ai.get_tool_with_permissions(p_tool_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  status ai.tool_status,
  credits_cost integer,
  collection_title text,
  suite_title text,
  can_edit boolean
) as $$
begin
  return query
  select 
    t.id,
    t.title,
    t.description,
    t.status,
    t.credits_cost,
    c.title as collection_title,
    s.title as suite_title,
    ai.can_edit_tool(t.id) as can_edit
  from ai.tools t
  left join ai.suites s on s.id = t.suite_id
  left join ai.collections c on c.id = s.collection_id
  where t.id = p_tool_id;
end;
$$ language plpgsql security definer;

-- Update the policies to use the new status column
drop policy if exists "Anyone can view published tools" on ai.tools;
create policy "Anyone can view published tools"
  on ai.tools for select
  using (status = 'published'::ai.tool_status); 