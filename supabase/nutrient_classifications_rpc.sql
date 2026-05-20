drop function if exists public.create_nutrient_classification(text, text, integer);
drop function if exists public.update_nutrient_classification(uuid, text, text);
drop function if exists public.delete_nutrient_classification(uuid);
drop function if exists public.list_nutrient_classifications();
drop function if exists public.find_nutrient_classification(text);

create or replace function public.list_nutrient_classifications()
returns setof public.nutrient_classifications
language sql
security definer
set search_path = public
as $$
  select *
  from public.nutrient_classifications
  where owner_id is null or owner_id = auth.uid()
  order by sort_order asc, created_at asc;
$$;

create or replace function public.find_nutrient_classification(p_name text)
returns public.nutrient_classifications
language plpgsql
security definer
set search_path = public
as $$
declare
  found_row public.nutrient_classifications;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  select *
  into found_row
  from public.nutrient_classifications
  where lower(name) = lower(trim(p_name))
    and (owner_id = auth.uid() or owner_id is null)
  order by owner_id is null asc, sort_order asc, created_at asc
  limit 1;

  return found_row;
end;
$$;

create or replace function public.create_nutrient_classification(
  p_color text,
  p_name text,
  p_sort_order integer default 0
)
returns public.nutrient_classifications
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_row public.nutrient_classifications;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.nutrient_classifications (owner_id, name, color, sort_order, active)
  values (auth.uid(), trim(p_name), coalesce(p_color, '#6b7280'), coalesce(p_sort_order, 0), true)
  returning * into inserted_row;

  return inserted_row;
end;
$$;

create or replace function public.update_nutrient_classification(
  p_id uuid,
  p_color text,
  p_name text
)
returns public.nutrient_classifications
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.nutrient_classifications;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  update public.nutrient_classifications
  set
    name = trim(p_name),
    color = coalesce(p_color, '#6b7280'),
    updated_at = now()
  where id = p_id
    and owner_id = auth.uid()
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Classificação não encontrada ou sem permissão para editar';
  end if;

  return updated_row;
end;
$$;

create or replace function public.delete_nutrient_classification(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  delete from public.nutrient_classifications
  where id = p_id
    and owner_id = auth.uid();
end;
$$;

grant execute on function public.create_nutrient_classification(text, text, integer) to authenticated;
grant execute on function public.update_nutrient_classification(uuid, text, text) to authenticated;
grant execute on function public.delete_nutrient_classification(uuid) to authenticated;
grant execute on function public.list_nutrient_classifications() to authenticated;
grant execute on function public.find_nutrient_classification(text) to authenticated;

notify pgrst, 'reload schema';
