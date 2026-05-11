-- Solo Certo - schema completo inicial
-- Rode este arquivo no Supabase: SQL Editor > New Query > Run.

create extension if not exists "pgcrypto";

-- =====================================================
-- 1) PERFIL DO USUÁRIO / CADASTRO
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  first_name text,
  last_name text,
  phone text,
  email text unique,
  birth_date date,
  cpf text unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  phone_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, name, first_name, last_name, phone, email, birth_date, cpf, role
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', ''))),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    new.email,
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    regexp_replace(coalesce(new.raw_user_meta_data->>'cpf', ''), '\\D', '', 'g'),
    'user'
  )
  on conflict (id) do update set
    name = excluded.name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    email = excluded.email,
    birth_date = excluded.birth_date,
    cpf = excluded.cpf,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================
-- 2) ASSINATURAS / TESTE GRÁTIS / PLANOS
-- =====================================================
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

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_code text references public.subscription_plans(code),
  status text not null default 'pending_payment' check (status in ('trialing', 'active', 'pending_payment', 'past_due', 'canceled', 'expired')),
  starts_at timestamptz not null default now(),
  trial_ends_at timestamptz,
  ends_at timestamptz,
  amount_cents integer not null default 0,
  currency text not null default 'BRL',
  payment_provider text default 'manual',
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans (code, name, billing_period, price_cents, trial_days, features) values
  ('trial_15', 'Teste grátis', '15 dias', 0, 15, '["Acesso completo por 15 dias"]'),
  ('mensal', 'Mensal', 'mensal', 4990, 0, '["Análise de solo ilimitada", "Histórico completo", "Planejamento de safra", "Relatórios"]'),
  ('trimestral', 'Trimestral', 'trimestral', 12990, 0, '["Tudo do mensal", "Suporte prioritário", "Exportação de PDF"]'),
  ('semestral', 'Semestral', 'semestral', 23990, 0, '["Tudo do trimestral", "Multi-propriedades"]'),
  ('anual', 'Anual', 'anual', 39990, 0, '["Tudo do semestral", "Backup na nuvem"]')
on conflict (code) do update set
  name = excluded.name,
  billing_period = excluded.billing_period,
  price_cents = excluded.price_cents,
  trial_days = excluded.trial_days,
  features = excluded.features,
  active = true;

-- =====================================================
-- 3) PARÂMETROS DE ANÁLISE DE SOLO
-- Valores são iniciais e podem ser refinados por recomendação técnica/agronômica.
-- =====================================================
create table if not exists public.analysis_parameters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  param_key text not null,
  symbol text not null,
  name text not null,
  parameter_group text not null,
  unit text,
  ranges jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, param_key)
);

insert into public.analysis_parameters (owner_id, param_key, symbol, name, parameter_group, unit, ranges) values
  (null, 'ph_agua', 'pH', 'pH (água)', 'quimicos', '', '[{"name":"Baixo","max":5.0,"color":"#ef4444"},{"name":"Médio","max":5.5,"color":"#fb923c"},{"name":"Adequado","max":6.5,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]'),
  (null, 'mo', 'MO', 'Matéria Orgânica', 'quimicos', 'dag/kg', '[{"name":"Baixo","max":1.5,"color":"#ef4444"},{"name":"Médio","max":3.0,"color":"#fb923c"},{"name":"Adequado","max":6.0,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]'),
  (null, 'p_mehlich', 'P', 'Fósforo Mehlich-1', 'macro', 'mg/dm³', '[{"name":"Baixo","max":10,"color":"#ef4444"},{"name":"Médio","max":20,"color":"#fb923c"},{"name":"Adequado","max":40,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]'),
  (null, 'k', 'K', 'Potássio', 'macro', 'mmolc/dm³', '[{"name":"Baixo","max":1.5,"color":"#ef4444"},{"name":"Médio","max":3.0,"color":"#fb923c"},{"name":"Adequado","max":4.5,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]'),
  (null, 'ca', 'Ca', 'Cálcio', 'macro', 'mmolc/dm³', '[{"name":"Baixo","max":15,"color":"#ef4444"},{"name":"Médio","max":25,"color":"#fb923c"},{"name":"Adequado","max":40,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]'),
  (null, 'mg', 'Mg', 'Magnésio', 'macro', 'mmolc/dm³', '[{"name":"Baixo","max":5,"color":"#ef4444"},{"name":"Médio","max":8,"color":"#fb923c"},{"name":"Adequado","max":15,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]'),
  (null, 'v', 'V%', 'Saturação por Bases', 'indices', '%', '[{"name":"Baixo","max":40,"color":"#ef4444"},{"name":"Médio","max":60,"color":"#fb923c"},{"name":"Adequado","max":80,"color":"#22c55e"},{"name":"Muito Alto","max":null,"color":"#8b5cf6"}]')
on conflict (owner_id, param_key) do nothing;

-- =====================================================
-- 4) TABELAS DE PRODUTIVIDADE / RECOMENDAÇÕES
-- =====================================================
create table if not exists public.productivity_tables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  code text,
  name text not null,
  min_bags_per_ha numeric,
  max_bags_per_ha numeric,
  nutrients jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, code)
);

insert into public.productivity_tables (owner_id, code, name, min_bags_per_ha, max_bags_per_ha, nutrients) values
  (null, 'ate_30', 'Até 30 sacas/ha', null, 30, '{"N":150,"P2O5":40,"K2O":120}'),
  (null, '31_50', '31 - 50 sacas/ha', 31, 50, '{"N":320,"P2O5":60,"K2O":200}'),
  (null, 'acima_50', 'Acima de 50 sacas/ha', 51, null, '{"N":400,"P2O5":80,"K2O":300}')
on conflict (owner_id, code) do nothing;

-- =====================================================
-- 5) CLONES DE CAFÉ CONILON/ROBUSTA
-- =====================================================
create table if not exists public.coffee_clones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  code text,
  name text not null,
  origin text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, code)
);

insert into public.coffee_clones (owner_id, code, name, origin, description) values
  (null, 'es1', 'Vitória Incaper 8142', 'ES', 'Alta produtividade, grãos grandes'),
  (null, 'es2', 'Diamante ES8112', 'ES', 'Tolerante à seca, maturação uniforme'),
  (null, 'es3', 'Jequitibá ES8122', 'ES', 'Vigor vegetativo, boa qualidade de bebida'),
  (null, 'es4', 'Centenária ES8132', 'ES', 'Resistência à ferrugem'),
  (null, 'es5', 'Robustão Capixaba (Emcaper 8151)', 'ES', 'Altamente produtivo'),
  (null, 'es6', 'Tributun (Incaper 8152)', 'ES', 'Tolerância à seca'),
  (null, 'ro1', 'BRS Ouro Preto (Cpafro 199)', 'RO', 'Alta produtividade, tolerante à seca'),
  (null, 'ro2', 'Conilon BRS 1216 (Robusta Amazônico)', 'RO', 'Adaptado ao clima amazônico'),
  (null, 'ro3', 'Cpafro 194', 'RO', 'Boa qualidade de bebida')
on conflict (owner_id, code) do nothing;

-- =====================================================
-- 6) PROPRIEDADES / TALHÕES / ANÁLISES / HISTÓRICO / SAFRA
-- Mantém formato flexível para o app atual e permite evoluir depois.
-- =====================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area numeric,
  talhoes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.soil_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  talhao_id text,
  title text,
  file_name text,
  analysis_date date,
  metadata jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crop_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crop_year integer not null,
  property_id uuid references public.properties(id) on delete set null,
  talhao_id text,
  recommendation_id text,
  nutrients jsonb not null default '[]'::jsonb,
  selected_months jsonb not null default '{}'::jsonb,
  total_cost numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, setting_key)
);

-- Compatibilidade com versões anteriores do app.
create table if not exists public.app_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, data_key)
);

-- =====================================================
-- 7) ROW LEVEL SECURITY
-- =====================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.analysis_parameters enable row level security;
alter table public.productivity_tables enable row level security;
alter table public.coffee_clones enable row level security;
alter table public.properties enable row level security;
alter table public.soil_analyses enable row level security;
alter table public.crop_plans enable row level security;
alter table public.user_settings enable row level security;
alter table public.app_data enable row level security;

-- Profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select using (
  auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Planos públicos para usuário logado
drop policy if exists "plans_select_authenticated" on public.subscription_plans;
create policy "plans_select_authenticated" on public.subscription_plans for select to authenticated using (active = true);

-- Assinaturas
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Dados globais + próprios
drop policy if exists "analysis_parameters_select_global_or_own" on public.analysis_parameters;
create policy "analysis_parameters_select_global_or_own" on public.analysis_parameters for select using (owner_id is null or owner_id = auth.uid());
drop policy if exists "analysis_parameters_insert_own" on public.analysis_parameters;
create policy "analysis_parameters_insert_own" on public.analysis_parameters for insert with check (owner_id = auth.uid());
drop policy if exists "analysis_parameters_update_own" on public.analysis_parameters;
create policy "analysis_parameters_update_own" on public.analysis_parameters for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "analysis_parameters_delete_own" on public.analysis_parameters;
create policy "analysis_parameters_delete_own" on public.analysis_parameters for delete using (owner_id = auth.uid());

drop policy if exists "productivity_select_global_or_own" on public.productivity_tables;
create policy "productivity_select_global_or_own" on public.productivity_tables for select using (owner_id is null or owner_id = auth.uid());
drop policy if exists "productivity_insert_own" on public.productivity_tables;
create policy "productivity_insert_own" on public.productivity_tables for insert with check (owner_id = auth.uid());
drop policy if exists "productivity_update_own" on public.productivity_tables;
create policy "productivity_update_own" on public.productivity_tables for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "productivity_delete_own" on public.productivity_tables;
create policy "productivity_delete_own" on public.productivity_tables for delete using (owner_id = auth.uid());

drop policy if exists "clones_select_global_or_own" on public.coffee_clones;
create policy "clones_select_global_or_own" on public.coffee_clones for select using (owner_id is null or owner_id = auth.uid());
drop policy if exists "clones_insert_own" on public.coffee_clones;
create policy "clones_insert_own" on public.coffee_clones for insert with check (owner_id = auth.uid());
drop policy if exists "clones_update_own" on public.coffee_clones;
create policy "clones_update_own" on public.coffee_clones for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "clones_delete_own" on public.coffee_clones;
create policy "clones_delete_own" on public.coffee_clones for delete using (owner_id = auth.uid());

-- Dados do usuário
drop policy if exists "properties_all_own" on public.properties;
create policy "properties_all_own" on public.properties for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "soil_analyses_all_own" on public.soil_analyses;
create policy "soil_analyses_all_own" on public.soil_analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "crop_plans_all_own" on public.crop_plans;
create policy "crop_plans_all_own" on public.crop_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_settings_all_own" on public.user_settings;
create policy "user_settings_all_own" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "app_data_all_own" on public.app_data;
create policy "app_data_all_own" on public.app_data for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================
-- 8) MODELO RELACIONAL POR TELA - PROPRIEDADES, TALHÕES,
--    CLONES, ANÁLISES E PLANEJAMENTO DE SAFRA
-- =====================================================
-- Este bloco mantém compatibilidade com as colunas antigas JSON,
-- mas passa a gravar os dados em tabelas próprias com foreign keys.

create table if not exists public.property_plots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  area numeric,
  planting_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_property_plots_user on public.property_plots(user_id);
create index if not exists idx_property_plots_property on public.property_plots(property_id);

create table if not exists public.plot_clones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  plot_id uuid not null references public.property_plots(id) on delete cascade,
  clone_id uuid references public.coffee_clones(id) on delete set null,
  quantity numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_plot_clones_user on public.plot_clones(user_id);
create index if not exists idx_plot_clones_plot on public.plot_clones(plot_id);
create index if not exists idx_plot_clones_clone on public.plot_clones(clone_id);

alter table public.soil_analyses
  add column if not exists plot_id uuid references public.property_plots(id) on delete set null;

create index if not exists idx_soil_analyses_plot on public.soil_analyses(plot_id);

create table if not exists public.soil_analysis_results (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.soil_analyses(id) on delete cascade,
  parameter_key text not null,
  value numeric,
  unit text,
  level_name text,
  level_color text,
  created_at timestamptz not null default now(),
  unique(analysis_id, parameter_key)
);

create index if not exists idx_soil_analysis_results_analysis on public.soil_analysis_results(analysis_id);

alter table public.crop_plans
  add column if not exists plot_id uuid references public.property_plots(id) on delete set null,
  add column if not exists productivity_table_id uuid references public.productivity_tables(id) on delete set null;

create index if not exists idx_crop_plans_plot on public.crop_plans(plot_id);
create index if not exists idx_crop_plans_productivity on public.crop_plans(productivity_table_id);

create table if not exists public.crop_plan_nutrients (
  id uuid primary key default gen_random_uuid(),
  crop_plan_id uuid not null references public.crop_plans(id) on delete cascade,
  nutrient text not null,
  need_kg_per_ha numeric,
  fertilizer_name text,
  fertilizer_percentage numeric,
  bag_size_kg numeric,
  bag_price numeric,
  calculated_cost numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_crop_plan_nutrients_plan on public.crop_plan_nutrients(crop_plan_id);

create table if not exists public.crop_plan_months (
  id uuid primary key default gen_random_uuid(),
  crop_plan_id uuid not null references public.crop_plans(id) on delete cascade,
  nutrient text not null,
  month_number integer not null check (month_number between 1 and 12),
  created_at timestamptz not null default now(),
  unique(crop_plan_id, nutrient, month_number)
);

create index if not exists idx_crop_plan_months_plan on public.crop_plan_months(crop_plan_id);

alter table public.property_plots enable row level security;
alter table public.plot_clones enable row level security;
alter table public.soil_analysis_results enable row level security;
alter table public.crop_plan_nutrients enable row level security;
alter table public.crop_plan_months enable row level security;

-- Talhões: cada usuário acessa apenas os próprios talhões.
drop policy if exists "property_plots_all_own" on public.property_plots;
create policy "property_plots_all_own" on public.property_plots
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Clones vinculados ao talhão: cada usuário acessa apenas os próprios vínculos.
drop policy if exists "plot_clones_all_own" on public.plot_clones;
create policy "plot_clones_all_own" on public.plot_clones
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Itens de análise: acesso permitido se a análise pai pertence ao usuário.
drop policy if exists "soil_analysis_results_select_own" on public.soil_analysis_results;
create policy "soil_analysis_results_select_own" on public.soil_analysis_results
for select using (
  exists (
    select 1 from public.soil_analyses a
    where a.id = soil_analysis_results.analysis_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "soil_analysis_results_insert_own" on public.soil_analysis_results;
create policy "soil_analysis_results_insert_own" on public.soil_analysis_results
for insert with check (
  exists (
    select 1 from public.soil_analyses a
    where a.id = soil_analysis_results.analysis_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "soil_analysis_results_update_own" on public.soil_analysis_results;
create policy "soil_analysis_results_update_own" on public.soil_analysis_results
for update using (
  exists (
    select 1 from public.soil_analyses a
    where a.id = soil_analysis_results.analysis_id
      and a.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.soil_analyses a
    where a.id = soil_analysis_results.analysis_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists "soil_analysis_results_delete_own" on public.soil_analysis_results;
create policy "soil_analysis_results_delete_own" on public.soil_analysis_results
for delete using (
  exists (
    select 1 from public.soil_analyses a
    where a.id = soil_analysis_results.analysis_id
      and a.user_id = auth.uid()
  )
);

-- Itens do planejamento: acesso permitido se o planejamento pai pertence ao usuário.
drop policy if exists "crop_plan_nutrients_all_own" on public.crop_plan_nutrients;
create policy "crop_plan_nutrients_all_own" on public.crop_plan_nutrients
for all using (
  exists (
    select 1 from public.crop_plans p
    where p.id = crop_plan_nutrients.crop_plan_id
      and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.crop_plans p
    where p.id = crop_plan_nutrients.crop_plan_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "crop_plan_months_all_own" on public.crop_plan_months;
create policy "crop_plan_months_all_own" on public.crop_plan_months
for all using (
  exists (
    select 1 from public.crop_plans p
    where p.id = crop_plan_months.crop_plan_id
      and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.crop_plans p
    where p.id = crop_plan_months.crop_plan_id
      and p.user_id = auth.uid()
  )
);
