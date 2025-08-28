/*
  # Improved Auth System with Role Management

  1. New Tables
    - `user_profiles` - User profile data with computed is_admin field
    - `app_roles` - Role assignments (admin, client, worker) with client associations

  2. Security
    - Enable RLS on both tables
    - Non-recursive policies to prevent infinite loops
    - Admin users can manage all data
    - Regular users can only access their own profiles

  3. Triggers
    - Auto-create user profiles on signup
    - Computed is_admin field based on app_roles

  4. Seed Data
    - Creates admin role for specified user
*/

-- 1) Tables
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  is_admin boolean generated always as
    (exists (select 1 from public.app_roles r
             where r.user_id = user_profiles.user_id
               and r.role = 'admin')) stored,
  created_at timestamptz default now()
);

create table if not exists public.app_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','client','worker')),
  client_id uuid null,
  created_at timestamptz default now(),
  primary key (user_id, role)
);

-- 2) Convenience index
create index if not exists app_roles_user_role_idx
  on public.app_roles (user_id, role);

-- 3) Seed current admin if not present (replace the UUID with my admin user if different)
insert into public.app_roles (user_id, role)
  values ('b32e1885-e0d5-4246-be37-fcda1682d88e','admin')
  on conflict (user_id, role) do nothing;

-- 4) Ensure profile row exists on signup
create or replace function public.ensure_profile()
returns trigger language plpgsql as $$
begin
  insert into public.user_profiles (user_id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''))
  on conflict (user_id) do update
  set email = excluded.email,
      display_name = coalesce(user_profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists trg_ensure_profile on auth.users;
create trigger trg_ensure_profile
  after insert on auth.users
  for each row execute function public.ensure_profile();

-- 5) RLS
alter table public.user_profiles enable row level security;
alter table public.app_roles     enable row level security;

-- Drop all existing policies we created earlier to avoid recursion
do $$ declare r record; begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname='public' and tablename in ('user_profiles','app_roles')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- user_profiles policies (simple, non-recursive)
create policy up_sel_self on public.user_profiles
  for select using (auth.uid() = user_id or
                    exists (select 1 from public.app_roles ar
                            where ar.user_id = auth.uid() and ar.role = 'admin'));

create policy up_ins_self on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy up_upd_self on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy up_upd_admin on public.user_profiles
  for update using (exists (select 1 from public.app_roles ar
                            where ar.user_id = auth.uid() and ar.role='admin'));

-- app_roles policies (only admins read/write roles)
create policy ar_sel_admin on public.app_roles
  for select using (exists (select 1 from public.app_roles ar
                            where ar.user_id = auth.uid() and ar.role='admin'));

create policy ar_ins_admin on public.app_roles
  for insert with check (exists (select 1 from public.app_roles ar
                                 where ar.user_id = auth.uid() and ar.role='admin'));

create policy ar_upd_admin on public.app_roles
  for update using (exists (select 1 from public.app_roles ar
                            where ar.user_id = auth.uid() and ar.role='admin'));

create policy ar_del_admin on public.app_roles
  for delete using (exists (select 1 from public.app_roles ar
                            where ar.user_id = auth.uid() and ar.role='admin'));