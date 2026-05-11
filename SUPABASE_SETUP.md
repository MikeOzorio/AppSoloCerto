# Configuração Supabase - Solo Certo

## 1. Criar projeto
Crie um projeto no Supabase e copie:

- Project URL
- anon public key

Coloque no `.env`:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

## 2. Rodar o schema
No painel do Supabase:

`SQL Editor > New Query`

Cole o conteúdo de `supabase/schema.sql` e clique em `Run`.

Esse SQL cria:

- `profiles`: cadastro do usuário com nome, sobrenome, telefone, e-mail, nascimento e CPF.
- `subscription_plans`: planos mensal, trimestral, semestral, anual e teste grátis.
- `subscriptions`: assinatura, teste de 15 dias e status de pagamento.
- `analysis_parameters`: parâmetros de análise de solo.
- `productivity_tables`: tabelas de produtividade/recomendações.
- `coffee_clones`: clones de café.
- `properties`: propriedades e talhões.
- `soil_analyses`: análises de solo/histórico.
- `crop_plans`: planejamento de safra.
- `user_settings`: configurações do usuário.
- `app_data`: compatibilidade com dados antigos do app.

## 3. Ativar confirmação de e-mail
No Supabase:

`Authentication > Providers > Email`

Mantenha confirmação de e-mail ativa para validar o cadastro.

## 4. SMS
O app já salva telefone no cadastro. Para SMS de verdade, configure um provedor no Supabase Auth, como Twilio, em:

`Authentication > Providers > Phone`

Enquanto SMS não estiver configurado, use validação por e-mail.

## 5. Primeiro acesso
Fluxo esperado:

1. Usuário clica em `Criar conta`.
2. Preenche nome, sobrenome, telefone, e-mail, nascimento, CPF e senha.
3. Recebe e valida o e-mail.
4. Faz login.
5. Escolhe teste grátis de 15 dias ou assinatura.
6. Após ativar teste/plano, entra no app.

## 6. Deploy na Vercel
Na Vercel, adicione as mesmas variáveis:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois faça `Redeploy`.
