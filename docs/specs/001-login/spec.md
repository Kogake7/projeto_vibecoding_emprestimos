# Spec 001 — Login e autorização de acesso

Revisão de 09/11/2026 aprovada pelo operador após apresentação da spec e plano,
com a resposta “Pode fazer”. Após T-04, “Continue” autorizou T-05; o pedido
posterior “pode fazer tudo” autorizou T-02/T-03 e as duas dependências
apresentadas. Implementação e checks locais concluídos. A conferência independente
[login-final-20261109-03](../../evidencias/verificador-login-final-20261109-03.md)
retornou **PRONTA**, com os onze CAs atendidos no estado final.
Prontidão limitada às provas locais; CI remoto, Preview e Supabase real não
foram validados. Não há autorização de publicação ou dados remotos.

## Objetivo

Permitir que uma pessoa convidada entre no sistema com e-mail e senha e receba somente o contexto do tenant ao qual pertence. Login é a primeira fatia porque todas as demais funcionalidades dependem de identidade, tenant e papel conhecidos no servidor.

## Vínculo com o PRD

Atende o item 1 da primeira versão: login e acesso aos próprios empréstimos. Esta spec cobre autenticação, sessão, contexto de acesso e permissões básicas; a listagem de empréstimos, o catálogo e as funções administrativas terão specs próprias.

## Regras

- O cadastro é fechado; não há autoinscrição.
- A identidade vem do Supabase Auth e a sessão é mantida por cookie `httpOnly` com `@supabase/ssr`.
- O middleware/proxy do Next renova sessões válidas.
- O servidor resolve `tenant_id` e `role` pela `Membership`; nenhum deles é aceito do cliente.
- Neste MVP, somente o tenant de slug `suporte_ti` pode ser usado. O servidor
  exige uma Membership existente entre a identidade autenticada e esse tenant.
  Não há seleção de tenant nem critério de primeira membership.
- A existência desse vínculo define acesso válido nesta versão; o schema não
  tem atividade ou suspensão. Não criar estado de atividade implicitamente.
- Pessoa autenticada sem esse vínculo recebe acesso negado, ainda que tenha
  vínculo ou papel administrativo em outro tenant, sem revelar tenants existentes.
- O papel vem da Membership de `suporte_ti`, nunca de input, cabeçalho de papel,
  metadados editáveis do usuário ou de outra Membership.
- Há dois papéis: COLLABORATOR e ADMIN. Operações é o perfil de negócio
  representado por ADMIN; não há papel separado de professor ou de Operações.
- ADMIN pode usar as funções de colaborador e as administrativas do mesmo tenant.
  COLLABORATOR não pode executar funções administrativas. A permissão deve ser
  validada no servidor, independentemente dos menus ou botões visíveis.
- O acesso ampliado de ADMIN não elimina regras de empréstimo nem isolamento
  por tenant. Nas funções pessoais, ele atua sobre os próprios empréstimos.
- Mensagem de credencial inválida não distingue e-mail inexistente de senha incorreta.
- A página de login não expõe token, cookie, chave de serviço ou detalhes do provedor.

## Critérios de aceitação

- CA-01 — credenciais válidas de pessoa com membership iniciam sessão e redirecionam para a área protegida.
- CA-02 — credenciais inválidas mantêm a pessoa no login e exibem mensagem genérica.
- CA-03 — rota protegida sem sessão redireciona para o login.
- CA-04 — sessão válida é renovada sem disponibilizar o token ao JavaScript do navegador.
- CA-05 — pessoa autenticada sem Membership em suporte_ti recebe `FORBIDDEN` e não acessa dados de domínio, inclusive quando possui vínculo em outra área.
- CA-06 — membership do tenant A nunca concede leitura ou mutação no tenant B.
- CA-07 — colaborador e administrador recebem o papel da Membership de suporte_ti, resolvido no servidor, sem aceitar papel ou tenant fornecidos pelo cliente.
- CA-08 — não existe fluxo público de cadastro ou convite nesta tela.
- CA-09 — colaborador recebe `FORBIDDEN` ao chamar uma operação administrativa,
  mesmo que tente acessá-la diretamente pela API ou declare ser administrador.
- CA-10 — ADMIN pode chamar operações permitidas a colaborador e a ADMIN no
  mesmo tenant; essa permissão não amplia acesso a outro tenant.
- CA-11 — quando existem vínculos com várias áreas, somente suporte_ti determina
  tenant e papel; ADMIN em outra área não promove COLLABORATOR em suporte_ti.

CA-09/10 verificam a base reutilizável de autorização nesta spec, não exigem
implementar catálogo, cadastro de equipamento ou painel de Operações aqui.

## Fora de escopo

Convite/provisionamento de usuários, recuperação de senha, MFA/SSO, seleção entre múltiplos tenants, gestão de papéis por interface, catálogo, empréstimos, devolução e painel administrativo.

## Contrato afetado

- UI: `/login` e comportamento de rotas protegidas.
- Supabase Auth: autenticação por e-mail/senha e renovação de sessão.
- Servidor: contexto tRPC com identidade da sessão validada, `tenantId`, `role`
  e Prisma; nenhum token integra o contrato retornado ao cliente.
- Autorização: protectedProcedure exige identidade validada; tenantProcedure
  exige vínculo em suporte_ti e aceita COLLABORATOR/ADMIN; adminProcedure
  acrescenta a exigência ADMIN. Tokens de sessão não fazem parte das respostas.
- Banco: leitura de `memberships (user_id, tenant_id, role)`; o schema já existe e não deve receber tabela de senha ou token.

## Perguntas e decisões

1. Quem envia convites?
   - Tipo: negócio.
   - Por que importa: determina quem pode conceder acesso ao sistema fechado.
   - Registro existente: administrador; o fluxo de convite fica fora desta spec.
2. Usuário com várias memberships escolhe tenant?
   - Tipo: negócio.
   - Por que importa: uma escolha indefinida pode abrir o contexto de uma área inesperada.
   - Decisão expressa do operador em 09/11/2026: usar somente suporte_ti neste
     MVP e exigir vínculo existente com essa área. Substitui “primeira membership
     ativa”; não depende de ordenação nem de coluna de atividade inexistente.
3. Qual é a duração da sessão?
   - Tipo: técnica.
   - Por que importa: afeta expiração e renovação sem exposição do token ao navegador.
   - Registro existente: seguir a configuração do Supabase Auth e renovar no servidor.
4. Qual é o destino após login?
   - Tipo: técnica.
   - Por que importa: permite verificar o redirecionamento antes de existir catálogo.
   - Registro existente: área autenticada inicial, com tela de estado autenticado.
5. Recuperação de senha, MFA e SSO entram nesta fatia?
   - Tipo: fora de escopo.
   - Por que importa: evita aumentar o fluxo de acesso além do login por convite.
   - Registro existente: os três permanecem fora desta spec.

6. Operações também pode usar funções de colaborador?
   - Tipo: negócio.
   - Decisão expressa do operador em 09/11/2026: sim; uma conta ADMIN do
     professor acessará ambas as visões. Provisionamento dessa conta fica na
     spec de dados iniciais e será executado pelo operador no deploy.

Os registros anteriores preservam o histórico sem fabricar aprovação antiga.
As decisões explícitas de 09/11 resolvem tenant e hierarquia dos papéis.
A revisão e o plano foram aprovados em seguida, inicialmente para executar
somente T-04. Após seu fechamento, o pedido “Continue” autorizou T-05, sem
autorizar T-02/T-03 ou publicação.

## O que o andar zero já garante

AZ-02/03 garantem conexão e migrations; AZ-05 garante interface → servidor; AZ-06 garante um comando de testes; AZ-07/08 garantem configuração sem segredo versionado. Esses itens não são repetidos como critérios de login.

## DDL esperado

Não criar tabela local de usuário, senha ou sessão. A identidade permanece em `auth.users`; a aplicação usa a `Membership` já versionada, com chave `(tenant_id, user_id)`, `tenant_id` obrigatório, FK para `Tenant`, RLS habilitada e sem policy pública. Qualquer ajuste futuro deve ser uma migration Prisma nova, nunca alteração manual.

### Adaptação autorizada da aula 9

Em 06/11/2026, o operador escolheu manter login e registrar a adaptação do
exercício. A fatia atravessa tela, backend e leitura de banco, mas reutiliza
schema existente; portanto não demonstra a criação de uma migration nova.
O DDL esperado nesta fatia é nenhum. As provocações de migration continuam
necessárias para verificar o limite de autoridade, sem criar schema artificial.

## Regras acionadas

Ao planejar e implementar: `rules/spec-flow.md`, `rules/secrets.md`, `rules/tests.md` e `rules/checks.md`. Se o schema precisar mudar, também `rules/migration.md`; publicação continua proibida sem autorização específica.
