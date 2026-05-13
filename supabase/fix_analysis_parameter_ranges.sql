-- Solo Certo - Correção relacionamento analysis_parameters x analysis_parameter_ranges
-- Rode este arquivo no Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists analysis_parameters (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    nutrient_name text,
    unit text,
    created_at timestamptz default now()
);

alter table analysis_parameters add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table analysis_parameters add column if not exists nutrient_name text;
alter table analysis_parameters add column if not exists unit text;
alter table analysis_parameters add column if not exists created_at timestamptz default now();

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

alter table analysis_parameters enable row level security;

drop policy if exists "analysis_parameters_all" on analysis_parameters;
create policy "analysis_parameters_all"
on analysis_parameters
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists analysis_parameter_ranges (
    id uuid primary key default gen_random_uuid(),
    parameter_id uuid,
    user_id uuid references auth.users(id) on delete cascade,
    classification_id uuid,
    comparison_type text not null default 'between',
    value_from numeric,
    value_to numeric,
    created_at timestamptz default now()
);

alter table analysis_parameter_ranges add column if not exists parameter_id uuid;
alter table analysis_parameter_ranges add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table analysis_parameter_ranges add column if not exists classification_id uuid;
alter table analysis_parameter_ranges add column if not exists comparison_type text not null default 'between';
alter table analysis_parameter_ranges add column if not exists value_from numeric;
alter table analysis_parameter_ranges add column if not exists value_to numeric;
alter table analysis_parameter_ranges add column if not exists created_at timestamptz default now();

alter table analysis_parameter_ranges
drop constraint if exists analysis_parameter_ranges_parameter_id_fkey;

alter table analysis_parameter_ranges
drop constraint if exists fk_analysis_parameter_ranges_parameter;

alter table analysis_parameter_ranges
add constraint analysis_parameter_ranges_parameter_id_fkey
foreign key (parameter_id)
references analysis_parameters(id)
on delete cascade;

do $$
begin
    if exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'nutrient_classifications'
    ) then
        alter table analysis_parameter_ranges
        drop constraint if exists analysis_parameter_ranges_classification_id_fkey;

        alter table analysis_parameter_ranges
        add constraint analysis_parameter_ranges_classification_id_fkey
        foreign key (classification_id)
        references nutrient_classifications(id)
        on delete set null;
    end if;
end $$;

alter table analysis_parameter_ranges enable row level security;

drop policy if exists "analysis_parameter_ranges_all" on analysis_parameter_ranges;
create policy "analysis_parameter_ranges_all"
on analysis_parameter_ranges
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
