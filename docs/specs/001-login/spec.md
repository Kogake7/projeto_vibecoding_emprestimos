# Spec 001 — Login por e-mail e senha

## Objetivo

Permitir que uma pessoa convidada entre no sistema com e-mail e senha e receba somente o contexto do tenant ao qual pertence. Login é a primeira fatia porque todas as demais funcionalidades dependem de identidade, tenant e papel conhecidos no servidor.

## Vínculo com o PRD

Atende o item 1 da primeira versão: login e acesso aos próprios empréstimos. Esta spec cobre somente autenticação, sessão e entrada na área protegida; a listagem de empréstimos terá spec própria.

## Regras

- O cadastro é fechado; não há autoinscrição.
- A identidade vem do Supabase Auth e a sessão é mantida por cookie `httpOnly` com `@supabase/ssr`.
- O middleware/proxy do Next renova sessões válidas.
- O servidor resolve `tenant_id` e `role` pela `Membership`; nenhum deles é aceito do cliente.
- Pessoa autenticada sem membership ativa recebe acesso negado sem revelar tenants existentes.
- Mensagem de credencial inválida não distingue e-mail inexistente de senha incorreta.
- A página de login não expõe token, cookie, chave de serviço ou detalhes do provedor.

## Critérios de aceitação

- CA-01 — credenciais válidas de pessoa com membership iniciam sessão e redirecionam para a área protegida.
- CA-02 — credenciais inválidas mantêm a pessoa no login e exibem mensagem genérica.
- CA-03 — rota protegida sem sessão redireciona para o login.
- CA-04 — sessão válida é renovada sem disponibilizar o token ao JavaScript do navegador.
- CA-05 — pessoa autenticada sem membership recebe `FORBIDDEN` e não acessa dados de domínio.
- CA-06 — membership do tenant A nunca concede leitura ou mutação no tenant B.
- CA-07 — colaborador e administrador recebem o papel da membership atual, resolvido no servidor.
- CA-08 — não existe fluxo público de cadastro ou convite nesta tela.

## Fora de escopo

Convite de usuários, recuperação de senha, MFA/SSO, seleção entre múltiplos tenants, catálogo, empréstimos, devolução e painel administrativo.

## Contrato afetado

- UI: `/login` e comportamento de rotas protegidas.
- Supabase Auth: autenticação por e-mail/senha e renovação de sessão.
- Servidor: contexto tRPC com `session`, `tenantId`, `role` e Prisma.
- Banco: leitura de `memberships (user_id, tenant_id, role)`; o schema já existe e não deve receber tabela de senha ou token.

## Perguntas e decisões

- Negócio — quem envia convites? Administrador; o fluxo fica fora desta spec.
- Negócio — usuário com várias memberships escolhe tenant? Fora do MVP; a primeira membership ativa é usada até decisão posterior.
- Técnica — duração da sessão? Segue a configuração do Supabase Auth e é renovada pelo servidor.
- Técnica — destino após login? Área autenticada inicial; até existir catálogo, uma tela de estado autenticado.
- Fora de escopo — recuperação de senha, MFA e SSO.

## O que o andar zero já garante

AZ-02/03 garantem conexão e migrations; AZ-05 garante interface → servidor; AZ-06 garante um comando de testes; AZ-07/08 garantem configuração sem segredo versionado. Esses itens não são repetidos como critérios de login.

## DDL esperado

Não criar tabela local de usuário, senha ou sessão. A identidade permanece em `auth.users`; a aplicação usa a `Membership` já versionada, com chave `(tenant_id, user_id)`, `tenant_id` obrigatório, FK para `Tenant`, RLS habilitada e sem policy pública. Qualquer ajuste futuro deve ser uma migration Prisma nova, nunca alteração manual.

## Regras acionadas

Ao planejar e implementar: `rules/spec-flow.md`, `rules/secrets.md`, `rules/tests.md` e `rules/checks.md`. Se o schema precisar mudar, também `rules/migration.md`; publicação continua proibida sem autorização específica.
