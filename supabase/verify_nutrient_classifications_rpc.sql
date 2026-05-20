select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_nutrient_classification',
    'update_nutrient_classification',
    'delete_nutrient_classification'
  )
order by p.proname;

notify pgrst, 'reload schema';
