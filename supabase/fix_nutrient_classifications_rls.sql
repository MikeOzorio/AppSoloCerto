alter table public.nutrient_classifications enable row level security;

drop policy if exists "nutrient_classifications_select_global_or_own" on public.nutrient_classifications;
drop policy if exists "nutrient_classifications_insert_own" on public.nutrient_classifications;
drop policy if exists "nutrient_classifications_update_own" on public.nutrient_classifications;
drop policy if exists "nutrient_classifications_delete_own" on public.nutrient_classifications;

create policy "nutrient_classifications_select_global_or_own"
on public.nutrient_classifications
for select
to authenticated
using (owner_id is null or owner_id = auth.uid());

create policy "nutrient_classifications_insert_own"
on public.nutrient_classifications
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "nutrient_classifications_update_own"
on public.nutrient_classifications
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "nutrient_classifications_delete_own"
on public.nutrient_classifications
for delete
to authenticated
using (owner_id = auth.uid());

grant select, insert, update, delete on public.nutrient_classifications to authenticated;
