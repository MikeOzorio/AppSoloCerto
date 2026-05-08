# Configuração do Supabase - Solo Certo

## 1. Criar projeto
Crie um projeto no Supabase e copie:

- Project URL
- anon public key

## 2. Rodar o SQL
No Supabase, acesse **SQL Editor > New query** e execute o arquivo:

```text
supabase/schema.sql
```

Ele cria:

- `profiles`: perfil dos usuários
- `app_data`: dados do app por usuário
- políticas RLS para cada usuário acessar somente seus dados
- trigger para criar perfil automaticamente quando um usuário é criado no Supabase Auth

## 3. Configurar variáveis locais
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

## 4. Criar primeiro usuário admin
No Supabase, vá em **Authentication > Users > Add user**.

Depois, em **Table Editor > profiles**, altere o campo `role` desse usuário para:

```text
admin
```

## 5. Vercel
Na Vercel, adicione as mesmas variáveis em:

```text
Project > Settings > Environment Variables
```

Depois faça novo deploy.

## Observação importante
O login antigo `admin@coffeti.com / admin123` foi removido. Agora o app usa Supabase Auth.
