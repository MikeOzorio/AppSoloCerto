-- Remove planos de safra duplicados e impede novos duplicados.
-- Duplicado = mesmo usuario + safra + propriedade + talhao/escopo.
-- A limpeza mantem o plano com mais aplicacoes marcadas; em empate, mantem o mais recente.

begin;

with status_counts as (
  select
    cp.id,
    count(status_keys.key) as marked_count
  from public.crop_plans cp
  left join public.user_settings us
    on us.user_id = cp.user_id
    and us.setting_key = 'cropApplicationStatus'
  left join lateral jsonb_object_keys(coalesce(us.setting_value, '{}'::jsonb)) as status_keys(key)
    on split_part(status_keys.key, ':', 1) = cp.id::text
  group by cp.id
),
ranked as (
  select
    cp.id,
    row_number() over (
      partition by
        cp.user_id,
        cp.crop_year,
        coalesce(cp.property_id, '00000000-0000-0000-0000-000000000000'::uuid),
        coalesce(cp.plot_id::text, nullif(cp.talhao_id, ''), '__property__')
      order by
        coalesce(sc.marked_count, 0) desc,
        cp.created_at desc,
        cp.id desc
    ) as duplicate_rank
  from public.crop_plans cp
  left join status_counts sc on sc.id = cp.id
)
delete from public.crop_plans cp
using ranked r
where cp.id = r.id
  and r.duplicate_rank > 1;

create unique index if not exists crop_plans_unique_user_year_scope
on public.crop_plans (
  user_id,
  crop_year,
  coalesce(property_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(plot_id::text, nullif(talhao_id, ''), '__property__')
);

commit;
