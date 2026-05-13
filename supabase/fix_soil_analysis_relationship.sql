-- Corrige relacionamento duplicado entre soil_analyses e soil_analysis_results
-- Rode no Supabase SQL Editor caso apareça:
-- "Could not embed because more than one relationship was found for 'soil_analyses' and 'soil_analysis_results'"

-- 1) Se existir a coluna antiga soil_analysis_id, copia os dados para analysis_id.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'soil_analysis_results'
      and column_name = 'soil_analysis_id'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'soil_analysis_results'
        and column_name = 'analysis_id'
    ) then
      execute 'update public.soil_analysis_results set analysis_id = soil_analysis_id where analysis_id is null and soil_analysis_id is not null';
    end if;
  end if;
end $$;

-- 2) Remove foreign keys antigas/duplicadas que apontam para soil_analyses, exceto a correta em analysis_id.
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.soil_analysis_results'::regclass
      and contype = 'f'
      and confrelid = 'public.soil_analyses'::regclass
      and conname <> 'soil_analysis_results_analysis_id_fkey'
  loop
    execute format('alter table public.soil_analysis_results drop constraint if exists %I', r.conname);
  end loop;
end $$;

-- 3) Garante a coluna e a FK correta.
alter table public.soil_analysis_results
  add column if not exists analysis_id uuid;

alter table public.soil_analysis_results
  drop constraint if exists soil_analysis_results_analysis_id_fkey;

alter table public.soil_analysis_results
  add constraint soil_analysis_results_analysis_id_fkey
  foreign key (analysis_id) references public.soil_analyses(id) on delete cascade;

-- 4) Remove a coluna antiga para o Supabase não encontrar duas relações.
alter table public.soil_analysis_results
  drop column if exists soil_analysis_id;

create index if not exists idx_soil_analysis_results_analysis
on public.soil_analysis_results(analysis_id);
