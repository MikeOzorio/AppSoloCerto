with defaults(name, color, sort_order) as (
  values
    ('Muito baixo', '#ef4444', 10),
    ('Baixo', '#f97316', 20),
    ('Médio', '#eab308', 30),
    ('Adequado', '#22c55e', 40),
    ('Alto', '#3b82f6', 50),
    ('Muito alto', '#8b5cf6', 60),
    ('Neutro', '#6b7280', 70),
    ('Alcalino', '#8b5cf6', 80)
)
insert into public.nutrient_classifications (owner_id, name, color, sort_order, active)
select null, d.name, d.color, d.sort_order, true
from defaults d
where not exists (
  select 1
  from public.nutrient_classifications c
  where c.owner_id is null and lower(c.name) = lower(d.name)
);
