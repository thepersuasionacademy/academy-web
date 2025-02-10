-- Update AI tools table policies
alter table ai.tools enable row level security;

create policy "Anyone can view published tools"
  on ai.tools for select
  using (status = 'published');

create policy "Super admins can view all tools"
  on ai.tools for select
  using (public.is_super_admin());

create policy "Super admins can update tools"
  on ai.tools for update
  using (public.is_super_admin());

create policy "Super admins can delete tools"
  on ai.tools for delete
  using (public.is_super_admin());

create policy "Super admins can insert tools"
  on ai.tools for insert
  with check (public.is_super_admin());

-- Create function to check if user can edit tool
create or replace function ai.can_edit_tool(tool_id uuid)
returns boolean as $$
begin
  return (
    select public.is_super_admin()
  );
end;
$$ language plpgsql security definer;

-- Create function to get tool with edit permission
create or replace function ai.get_tool_with_permissions(p_tool_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  status text,
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