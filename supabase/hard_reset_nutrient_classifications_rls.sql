do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'nutrient_classifications'
  loop
    execute format(
      'drop policy if exists %I on public.nutrient_classifications',
      policy_record.policyname
    );
  end loop;
end $$;

alter table public.nutrient_classifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.nutrient_classifications to anon, authenticated;
grant insert, update, delete on public.nutrient_classifications to authenticated;

create policy "nutrient_classifications_select_global_or_own"
on public.nutrient_classifications
as permissive
for select
to anon, authenticated
using (owner_id is null or owner_id = auth.uid());

create policy "nutrient_classifications_insert_own"
on public.nutrient_classifications
as permissive
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "nutrient_classifications_update_own"
on public.nutrient_classifications
as permissive
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "nutrient_classifications_delete_own"
on public.nutrient_classifications
as permissive
for delete
to authenticated
using (owner_id = auth.uid());
