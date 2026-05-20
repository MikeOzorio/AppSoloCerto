-- Promove um usuário para administrador.
-- Troque o e-mail abaixo pelo e-mail da sua conta e rode no SQL Editor do Supabase.

do $$
declare
  target_email text := 'SEU_EMAIL_AQUI';
  target_user_id uuid;
begin
  select id
    into target_user_id
  from public.profiles
  where lower(email) = lower(target_email)
  limit 1;

  if target_user_id is null then
    raise exception 'Usuário com e-mail % não encontrado em public.profiles.', target_email;
  end if;

  update public.profiles
  set role = 'admin'
  where id = target_user_id;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  where id = target_user_id;

  raise notice 'Usuário % promovido para admin.', target_email;
end $$;

select id, email, role
from public.profiles
where lower(email) = lower('SEU_EMAIL_AQUI');
