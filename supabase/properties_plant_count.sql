-- Adiciona a quantidade total de plantas na propriedade e protege o limite dos talhoes.

alter table public.properties
  add column if not exists plant_count numeric;

update public.properties p
   set plant_count = totals.total_plants
  from (
    select property_id, coalesce(sum(quantity), 0) as total_plants
      from public.plot_clones
     group by property_id
  ) totals
 where p.id = totals.property_id
   and (p.plant_count is null or p.plant_count = 0)
   and totals.total_plants > 0;

alter table public.properties
  drop constraint if exists properties_plant_count_positive;

alter table public.properties
  add constraint properties_plant_count_positive
  check (plant_count is null or plant_count > 0);

create or replace function public.validate_plot_clones_plant_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid := new.property_id;
  v_property_limit numeric;
  v_plot_total numeric;
begin
  select plant_count
    into v_property_limit
    from public.properties
   where id = v_property_id;

  if v_property_limit is null then
    return coalesce(new, old);
  end if;

  select coalesce(sum(quantity), 0)
    into v_plot_total
    from public.plot_clones
   where property_id = v_property_id;

  if v_plot_total > v_property_limit then
    raise exception 'A soma de plantas dos talhões não pode passar da quantidade total da propriedade.';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_plot_clones_plant_limit on public.plot_clones;

create trigger trg_plot_clones_plant_limit
after insert or update on public.plot_clones
for each row execute function public.validate_plot_clones_plant_limit();
