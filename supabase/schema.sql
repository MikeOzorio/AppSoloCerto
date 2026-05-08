-- Execute este SQL no Supabase em: SQL Editor > New query > Run
-- Depois crie o primeiro usuário em Authentication > Users.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  trial_days integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.app_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, data_key)
);

alter table public.profiles enable row level security;
alter table public.app_data enable row level security;

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = user_uuid and role = 'admin');
$$;


drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "app_data_select_own" on public.app_data;
create policy "app_data_select_own" on public.app_data for select to authenticated using (user_id = auth.uid());

drop policy if exists "app_data_insert_own" on public.app_data;
create policy "app_data_insert_own" on public.app_data for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "app_data_update_own" on public.app_data;
create policy "app_data_update_own" on public.app_data for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "app_data_delete_own" on public.app_data;
create policy "app_data_delete_own" on public.app_data for delete to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, trial_days)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(nullif(new.raw_user_meta_data->>'trial_days', '')::integer, 0)
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
