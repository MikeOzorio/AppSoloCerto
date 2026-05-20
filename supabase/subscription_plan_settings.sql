-- Configuração administrativa dos planos de assinatura.
-- Rode este arquivo no SQL Editor do Supabase antes de salvar pela tela.

create table if not exists public.subscription_plan_settings (
  id text primary key default 'default',
  plan_config jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  code text primary key,
  name text not null,
  billing_period text not null,
  price_cents integer not null default 0,
  trial_days integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscription_plan_settings enable row level security;
alter table public.subscription_plans enable row level security;

grant select on public.subscription_plan_settings to authenticated;
grant insert, update, delete on public.subscription_plan_settings to authenticated;
grant select on public.subscription_plans to authenticated;
grant insert, update, delete on public.subscription_plans to authenticated;

drop policy if exists "subscription_plan_settings_select_authenticated" on public.subscription_plan_settings;
create policy "subscription_plan_settings_select_authenticated"
on public.subscription_plan_settings
for select
to authenticated
using (true);

drop policy if exists "subscription_plan_settings_admin_insert" on public.subscription_plan_settings;
create policy "subscription_plan_settings_admin_insert"
on public.subscription_plan_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "subscription_plan_settings_admin_update" on public.subscription_plan_settings;
create policy "subscription_plan_settings_admin_update"
on public.subscription_plan_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "subscription_plan_settings_admin_delete" on public.subscription_plan_settings;
create policy "subscription_plan_settings_admin_delete"
on public.subscription_plan_settings
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "subscription_plans_admin_write" on public.subscription_plans;
create policy "subscription_plans_admin_write"
on public.subscription_plans
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

insert into public.subscription_plan_settings (id, plan_config)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.subscription_plans
  (code, name, billing_period, price_cents, trial_days, features, active)
values
  ('basic_monthly', 'Básico Mensal', 'monthly', 4990, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Análise de Solo", "Histórico de análises", "Relatórios de Safra", "Suporte"]'::jsonb, true),
  ('basic_quarterly', 'Básico Trimestral', 'quarterly', 13470, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Análise de Solo", "Histórico de análises", "Relatórios de Safra", "Suporte"]'::jsonb, true),
  ('basic_semiannual', 'Básico Semestral', 'semiannual', 25440, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Análise de Solo", "Histórico de análises", "Relatórios de Safra", "Suporte"]'::jsonb, true),
  ('basic_annual', 'Básico Anual', 'annual', 44910, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Análise de Solo", "Histórico de análises", "Relatórios de Safra", "Suporte"]'::jsonb, true),
  ('advanced_monthly', 'Avançado Mensal', 'monthly', 8990, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Classificações", "Análise de Solo", "Histórico de análises", "Planejamento de Safra", "Aplicações da Safra", "Relatórios de Safra", "Calagem e Gessagem", "Conversão de Unidades", "Divisão Mensal Global", "Suporte"]'::jsonb, true),
  ('advanced_quarterly', 'Avançado Trimestral', 'quarterly', 24270, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Classificações", "Análise de Solo", "Histórico de análises", "Planejamento de Safra", "Aplicações da Safra", "Relatórios de Safra", "Calagem e Gessagem", "Conversão de Unidades", "Divisão Mensal Global", "Suporte"]'::jsonb, true),
  ('advanced_semiannual', 'Avançado Semestral', 'semiannual', 45840, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Classificações", "Análise de Solo", "Histórico de análises", "Planejamento de Safra", "Aplicações da Safra", "Relatórios de Safra", "Calagem e Gessagem", "Conversão de Unidades", "Divisão Mensal Global", "Suporte"]'::jsonb, true),
  ('advanced_annual', 'Avançado Anual', 'annual', 80910, 0, '["Início", "Tarefas", "Propriedades e talhões", "Clones", "Classificações", "Análise de Solo", "Histórico de análises", "Planejamento de Safra", "Aplicações da Safra", "Relatórios de Safra", "Calagem e Gessagem", "Conversão de Unidades", "Divisão Mensal Global", "Suporte"]'::jsonb, true),
  ('premium_monthly', 'Premium Mensal', 'monthly', 14990, 0, '["Acesso completo"]'::jsonb, true),
  ('premium_quarterly', 'Premium Trimestral', 'quarterly', 40470, 0, '["Acesso completo"]'::jsonb, true),
  ('premium_semiannual', 'Premium Semestral', 'semiannual', 76440, 0, '["Acesso completo"]'::jsonb, true),
  ('premium_annual', 'Premium Anual', 'annual', 134910, 0, '["Acesso completo"]'::jsonb, true)
on conflict (code) do update set
  name = excluded.name,
  billing_period = excluded.billing_period,
  price_cents = excluded.price_cents,
  trial_days = excluded.trial_days,
  features = excluded.features,
  active = excluded.active;
