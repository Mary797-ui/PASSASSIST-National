-- PASSASSIST National — Phase 2: Supabase Auth profile table
-- Run this complete script in Supabase Dashboard > SQL Editor.
-- Public registration always creates the 'citizen' role.
-- Never allow browser users to assign themselves privileged roles.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'citizen'
    check (role in ('citizen', 'office_officer', 'regional_manager',
                    'national_admin', 'security_admin', 'reporting_analyst')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Remove broad default table permissions, then grant only what citizens need.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update their own basic profile" on public.profiles;
create policy "Users can update their own basic profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create a citizen profile automatically whenever Supabase Auth creates a user.
create or replace function public.handle_new_passassist_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'citizen'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_passassist_user() from public, anon, authenticated;

drop trigger if exists on_passassist_auth_user_created on auth.users;
create trigger on_passassist_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_passassist_user();

-- Verify that Row Level Security is enabled:
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'profiles';
