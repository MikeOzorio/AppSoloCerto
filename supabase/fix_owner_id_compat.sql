-- =========================================================
-- SOLO CERTO - COMPATIBILIDADE OWNER_ID / USER_ID
-- Rode este schema completo no Supabase SQL Editor.
-- Este bloco corrige bancos que foram criados com user_id
-- enquanto o app atual usa owner_id para dados globais/usuário.
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.nutrient_classifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text,
  color text,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.nutrient_classifications add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.nutrient_classifications add column if not exists name text;
alter table public.nutrient_classifications add column if not exists color text;
alter table public.nutrient_classifications add column if not exists sort_order integer default 0;
alter table public.nutrient_classifications add column if not exists active boolean default true;
alter table public.nutrient_classifications add column if not exists created_at timestamptz default now();
alter table public.nutrient_classifications add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nutrient_classifications'
      and column_name = 'user_id'
  ) then
    execute 'update public.nutrient_classifications set owner_id = user_id where owner_id is null';
  end if;
end $$;

alter table public.nutrient_classifications drop constraint if exists uq_nutrient_classification;
alter table public.nutrient_classifications drop constraint if exists nutrient_classifications_user_id_name_key;
alter table public.nutrient_classifications drop constraint if exists nutrient_classifications_owner_id_name_key;
alter table public.nutrient_classifications add constraint nutrient_classifications_owner_id_name_key unique(owner_id, name);

create table if not exists public.analysis_parameters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  param_key text,
  symbol text,
  name text,
  parameter_group text,
  unit text,
  ranges jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.analysis_parameters add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.analysis_parameters add column if not exists param_key text;
alter table public.analysis_parameters add column if not exists symbol text;
alter table public.analysis_parameters add column if not exists name text;
alter table public.analysis_parameters add column if not exists parameter_group text;
alter table public.analysis_parameters add column if not exists unit text;
alter table public.analysis_parameters add column if not exists ranges jsonb default '[]'::jsonb;
alter table public.analysis_parameters add column if not exists active boolean default true;
alter table public.analysis_parameters add column if not exists created_at timestamptz default now();
alter table public.analysis_parameters add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analysis_parameters'
      and column_name = 'user_id'
  ) then
    execute 'update public.analysis_parameters set owner_id = user_id where owner_id is null';
  end if;
end $$;

alter table public.analysis_parameters drop constraint if exists analysis_parameters_user_id_param_key_key;
alter table public.analysis_parameters drop constraint if exists analysis_parameters_owner_id_param_key_key;
alter table public.analysis_parameters add constraint analysis_parameters_owner_id_param_key_key unique(owner_id, param_key);

create table if not exists public.analysis_parameter_ranges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  parameter_id uuid,
  classification_id uuid,
  comparison_type text default 'between',
  value_from numeric,
  value_to numeric,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.analysis_parameter_ranges add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.analysis_parameter_ranges add column if not exists parameter_id uuid;
alter table public.analysis_parameter_ranges add column if not exists classification_id uuid;
alter table public.analysis_parameter_ranges add column if not exists comparison_type text default 'between';
alter table public.analysis_parameter_ranges add column if not exists value_from numeric;
alter table public.analysis_parameter_ranges add column if not exists value_to numeric;
alter table public.analysis_parameter_ranges add column if not exists sort_order integer default 0;
alter table public.analysis_parameter_ranges add column if not exists created_at timestamptz default now();
alter table public.analysis_parameter_ranges add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analysis_parameter_ranges'
      and column_name = 'user_id'
  ) then
    execute 'update public.analysis_parameter_ranges set owner_id = user_id where owner_id is null';
  end if;
end $$;

alter table public.analysis_parameter_ranges drop constraint if exists analysis_parameter_ranges_parameter_id_fkey;
alter table public.analysis_parameter_ranges add constraint analysis_parameter_ranges_parameter_id_fkey
  foreign key (parameter_id) references public.analysis_parameters(id) on delete cascade;

alter table public.analysis_parameter_ranges drop constraint if exists analysis_parameter_ranges_classification_id_fkey;
alter table public.analysis_parameter_ranges add constraint analysis_parameter_ranges_classification_id_fkey
  foreign key (classification_id) references public.nutrient_classifications(id) on delete set null;

notify pgrst, 'reload schema';

