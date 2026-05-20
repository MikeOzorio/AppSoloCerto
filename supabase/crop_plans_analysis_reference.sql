-- Vincula planejamentos de safra a analises de solo salvas.
-- Rode no SQL Editor do Supabase antes de salvar novos planejamentos com analise base.

alter table public.crop_plans
  add column if not exists analysis_id uuid references public.soil_analyses(id) on delete set null,
  add column if not exists analysis_snapshot jsonb not null default '{}'::jsonb;

create index if not exists idx_crop_plans_analysis
  on public.crop_plans(analysis_id);
