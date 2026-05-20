-- Garante a tabela usada para salvar configuracoes do usuario no Supabase.
-- Rode este arquivo no SQL Editor se o banco ainda nao tiver user_settings.

create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, setting_key)
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_all_own" on public.user_settings;
create policy "user_settings_all_own" on public.user_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
