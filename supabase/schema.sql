-- Solo Certo - Migração corrigida para Supabase
-- Objetivo: padronizar tabelas relacionais usando user_id.
-- Corrige casos em que tabelas antigas tinham owner_id em vez de user_id.

create extension if not exists "pgcrypto";

-- =========================
-- PROFILES
-- =========================

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text,
    last_name text,
    phone text,
    cpf text,
    birth_date date,
    email text,
    role text default 'user',
    trial_start_at timestamptz default now(),
    trial_end_at timestamptz default (now() + interval '15 days'),
    subscription_status text default 'trial',
    created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_select" on profiles;
create policy "profiles_select"
on profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert"
on profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update" on profiles;
create policy "profiles_update"
on profiles for update
using (auth.uid() = id);


-- =========================
-- PROPERTIES
-- =========================

create table if not exists properties (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text,
    city text,
    state text,
    total_area numeric,
    created_at timestamptz default now()
);

alter table properties add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table properties add column if not exists name text;
alter table properties add column if not exists city text;
alter table properties add column if not exists state text;
alter table properties add column if not exists total_area numeric;
alter table properties add column if not exists created_at timestamptz default now();

alter table properties enable row level security;

drop policy if exists "properties_all" on properties;
create policy "properties_all"
on properties
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- PROPERTY PLOTS / TALHÕES
-- =========================

create table if not exists property_plots (
    id uuid primary key default gen_random_uuid(),
    property_id uuid references properties(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    name text,
    area numeric,
    spacing text,
    created_at timestamptz default now()
);

alter table property_plots add column if not exists property_id uuid references properties(id) on delete cascade;
alter table property_plots add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table property_plots add column if not exists name text;
alter table property_plots add column if not exists area numeric;
alter table property_plots add column if not exists spacing text;
alter table property_plots add column if not exists created_at timestamptz default now();

alter table property_plots enable row level security;

drop policy if exists "property_plots_all" on property_plots;
create policy "property_plots_all"
on property_plots
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- COFFEE CLONES
-- =========================

create table if not exists coffee_clones (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    code text,
    description text,
    maturation_cycle text,
    created_at timestamptz default now()
);

alter table coffee_clones add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table coffee_clones add column if not exists code text;
alter table coffee_clones add column if not exists description text;
alter table coffee_clones add column if not exists maturation_cycle text;
alter table coffee_clones add column if not exists created_at timestamptz default now();

alter table coffee_clones enable row level security;

drop policy if exists "coffee_clones_all" on coffee_clones;
create policy "coffee_clones_all"
on coffee_clones
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- PLOT CLONES
-- =========================

create table if not exists plot_clones (
    id uuid primary key default gen_random_uuid(),
    plot_id uuid references property_plots(id) on delete cascade,
    clone_id uuid references coffee_clones(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    quantity integer,
    created_at timestamptz default now()
);

alter table plot_clones add column if not exists plot_id uuid references property_plots(id) on delete cascade;
alter table plot_clones add column if not exists clone_id uuid references coffee_clones(id) on delete cascade;
alter table plot_clones add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table plot_clones add column if not exists quantity integer;
alter table plot_clones add column if not exists created_at timestamptz default now();

alter table plot_clones enable row level security;

drop policy if exists "plot_clones_all" on plot_clones;
create policy "plot_clones_all"
on plot_clones
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- NUTRIENT CLASSIFICATIONS
-- =========================

create table if not exists nutrient_classifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text,
    color text,
    created_at timestamptz default now()
);

alter table nutrient_classifications add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table nutrient_classifications add column if not exists name text;
alter table nutrient_classifications add column if not exists color text;
alter table nutrient_classifications add column if not exists created_at timestamptz default now();

alter table nutrient_classifications drop constraint if exists uq_nutrient_classification;
alter table nutrient_classifications add constraint uq_nutrient_classification unique(user_id, name);

alter table nutrient_classifications enable row level security;

drop policy if exists "nutrient_classifications_all" on nutrient_classifications;
create policy "nutrient_classifications_all"
on nutrient_classifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- ANALYSIS PARAMETERS
-- =========================

create table if not exists analysis_parameters (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    nutrient_name text,
    comparison_type text,
    value_from numeric,
    value_to numeric,
    classification_id uuid references nutrient_classifications(id) on delete set null,
    created_at timestamptz default now()
);

-- Corrige tabela antiga que tinha owner_id.
alter table analysis_parameters add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'analysis_parameters'
          and column_name = 'owner_id'
    ) then
        execute 'update analysis_parameters set user_id = owner_id where user_id is null';
    end if;
end $$;

alter table analysis_parameters add column if not exists nutrient_name text;
alter table analysis_parameters add column if not exists comparison_type text;
alter table analysis_parameters add column if not exists value_from numeric;
alter table analysis_parameters add column if not exists value_to numeric;
alter table analysis_parameters add column if not exists classification_id uuid references nutrient_classifications(id) on delete set null;
alter table analysis_parameters add column if not exists created_at timestamptz default now();

alter table analysis_parameters enable row level security;

drop policy if exists "analysis_parameters_all" on analysis_parameters;
create policy "analysis_parameters_all"
on analysis_parameters
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- SOIL ANALYSES
-- =========================

create table if not exists soil_analyses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    property_id uuid references properties(id) on delete cascade,
    plot_id uuid references property_plots(id) on delete cascade,
    analysis_date date,
    laboratory text,
    notes text,
    created_at timestamptz default now()
);

alter table soil_analyses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table soil_analyses add column if not exists property_id uuid references properties(id) on delete cascade;
alter table soil_analyses add column if not exists plot_id uuid references property_plots(id) on delete cascade;
alter table soil_analyses add column if not exists analysis_date date;
alter table soil_analyses add column if not exists laboratory text;
alter table soil_analyses add column if not exists notes text;
alter table soil_analyses add column if not exists created_at timestamptz default now();

alter table soil_analyses enable row level security;

drop policy if exists "soil_analyses_all" on soil_analyses;
create policy "soil_analyses_all"
on soil_analyses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- SOIL ANALYSIS RESULTS
-- =========================

create table if not exists soil_analysis_results (
    id uuid primary key default gen_random_uuid(),
    soil_analysis_id uuid references soil_analyses(id) on delete cascade,
    parameter_id uuid references analysis_parameters(id) on delete set null,
    nutrient_name text,
    result_value numeric,
    classification_id uuid references nutrient_classifications(id) on delete set null,
    created_at timestamptz default now()
);

alter table soil_analysis_results add column if not exists soil_analysis_id uuid references soil_analyses(id) on delete cascade;
alter table soil_analysis_results add column if not exists parameter_id uuid references analysis_parameters(id) on delete set null;
alter table soil_analysis_results add column if not exists nutrient_name text;
alter table soil_analysis_results add column if not exists result_value numeric;
alter table soil_analysis_results add column if not exists classification_id uuid references nutrient_classifications(id) on delete set null;
alter table soil_analysis_results add column if not exists created_at timestamptz default now();


-- =========================
-- PRODUCTIVITY TABLES
-- =========================

create table if not exists productivity_tables (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text,
    productivity numeric,
    created_at timestamptz default now()
);

alter table productivity_tables add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table productivity_tables add column if not exists name text;
alter table productivity_tables add column if not exists productivity numeric;
alter table productivity_tables add column if not exists created_at timestamptz default now();

alter table productivity_tables enable row level security;

drop policy if exists "productivity_tables_all" on productivity_tables;
create policy "productivity_tables_all"
on productivity_tables
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- CROP PLANS
-- =========================

create table if not exists crop_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    property_id uuid references properties(id) on delete cascade,
    plot_id uuid references property_plots(id) on delete cascade,
    harvest_year integer,
    target_productivity numeric,
    created_at timestamptz default now()
);

alter table crop_plans add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table crop_plans add column if not exists property_id uuid references properties(id) on delete cascade;
alter table crop_plans add column if not exists plot_id uuid references property_plots(id) on delete cascade;
alter table crop_plans add column if not exists harvest_year integer;
alter table crop_plans add column if not exists target_productivity numeric;
alter table crop_plans add column if not exists created_at timestamptz default now();

alter table crop_plans enable row level security;

drop policy if exists "crop_plans_all" on crop_plans;
create policy "crop_plans_all"
on crop_plans
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- CROP PLAN NUTRIENTS
-- =========================

create table if not exists crop_plan_nutrients (
    id uuid primary key default gen_random_uuid(),
    crop_plan_id uuid references crop_plans(id) on delete cascade,
    nutrient_name text,
    recommended_quantity numeric,
    created_at timestamptz default now()
);

alter table crop_plan_nutrients add column if not exists crop_plan_id uuid references crop_plans(id) on delete cascade;
alter table crop_plan_nutrients add column if not exists nutrient_name text;
alter table crop_plan_nutrients add column if not exists recommended_quantity numeric;
alter table crop_plan_nutrients add column if not exists created_at timestamptz default now();


-- =========================
-- CROP PLAN MONTHS
-- =========================

create table if not exists crop_plan_months (
    id uuid primary key default gen_random_uuid(),
    crop_plan_id uuid references crop_plans(id) on delete cascade,
    month_name text,
    percentage numeric,
    created_at timestamptz default now()
);

alter table crop_plan_months add column if not exists crop_plan_id uuid references crop_plans(id) on delete cascade;
alter table crop_plan_months add column if not exists month_name text;
alter table crop_plan_months add column if not exists percentage numeric;
alter table crop_plan_months add column if not exists created_at timestamptz default now();


-- =========================
-- USER SETTINGS
-- =========================

create table if not exists user_settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    theme text default 'light',
    monthly_division_global jsonb,
    created_at timestamptz default now()
);

alter table user_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table user_settings add column if not exists theme text default 'light';
alter table user_settings add column if not exists monthly_division_global jsonb;
alter table user_settings add column if not exists created_at timestamptz default now();

alter table user_settings enable row level security;

drop policy if exists "user_settings_all" on user_settings;
create policy "user_settings_all"
on user_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- =========================
-- ACTIVITY HISTORY
-- =========================

create table if not exists activity_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    action_type text,
    entity_name text,
    entity_id uuid,
    description text,
    created_at timestamptz default now()
);

alter table activity_history add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table activity_history add column if not exists action_type text;
alter table activity_history add column if not exists entity_name text;
alter table activity_history add column if not exists entity_id uuid;
alter table activity_history add column if not exists description text;
alter table activity_history add column if not exists created_at timestamptz default now();

alter table activity_history enable row level security;

drop policy if exists "activity_history_all" on activity_history;
create policy "activity_history_all"
on activity_history
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
