-- Create an enum for user roles
create type public.user_role as enum ('user', 'admin', 'super_admin');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role user_role not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create policies
create policy "Users can view their own role"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Super admins can view all roles"
  on public.user_roles for select
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
      and role = 'super_admin'
    )
  );

create policy "Super admins can update roles"
  on public.user_roles for update
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = auth.uid()
      and role = 'super_admin'
    )
  );

-- Create function to check if user is super admin
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role = 'super_admin'
  );
end;
$$ language plpgsql security definer;

-- Create function to set user role
create or replace function public.set_user_role(
  target_user_id uuid,
  new_role user_role
)
returns void as $$
begin
  -- Check if the calling user is a super admin
  if not public.is_super_admin() then
    raise exception 'Only super admins can set user roles';
  end if;

  -- Insert or update the role
  insert into public.user_roles (user_id, role)
  values (target_user_id, new_role)
  on conflict (user_id)
  do update set
    role = excluded.role,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Create trigger to update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_roles_updated_at
  before update on public.user_roles
  for each row
  execute function public.update_updated_at_column();

-- Create function to get user role
create or replace function public.get_user_role(user_id uuid)
returns user_role as $$
begin
  return (
    select role
    from public.user_roles
    where user_id = $1
  );
end;
$$ language plpgsql security definer; 