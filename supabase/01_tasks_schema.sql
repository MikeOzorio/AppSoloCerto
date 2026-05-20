-- =====================================================
-- SOLO CERTO - TABELA DE TAREFAS / OPERAÇÕES
-- Rode este arquivo no Supabase: SQL Editor > New Query > Run.
-- =====================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster queries filtering by user and date
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);

-- Row Level Security
alter table public.tasks enable row level security;

drop policy if exists "tasks_all_own" on public.tasks;
create policy "tasks_all_own" on public.tasks 
  for all using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
