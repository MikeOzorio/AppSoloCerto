-- Limpeza da estrutura antiga usada nas primeiras versões do App Solo Certo.
-- Rode depois de confirmar que o app já está usando as tabelas relacionais.

drop table if exists public.app_data cascade;

-- Opcional: zerar colunas JSON legadas para evitar confusão ao consultar manualmente.
-- Não apaga as tabelas relacionais novas.
update public.properties set talhoes = '[]'::jsonb where talhoes <> '[]'::jsonb;
update public.soil_analyses set results = '{}'::jsonb where results <> '{}'::jsonb;
update public.crop_plans set nutrients = '[]'::jsonb, selected_months = '{}'::jsonb
where nutrients <> '[]'::jsonb or selected_months <> '{}'::jsonb;
