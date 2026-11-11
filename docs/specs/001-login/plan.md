# Plano 001 — Login e autorização de acesso

Revisão de 09/11/2026 aprovada pelo operador com a spec atualizada.
T-04/T-05 concluídas e validadas localmente.
O operador depois autorizou “pode fazer tudo”: executar T-02/T-03, instalar as
duas dependências apresentadas e validar localmente. Não há autorização de deploy.
T-02/T-03 também foram implementadas e os checks locais passaram. A conferência
independente login-final-20261109-03 retornou PRONTA para os onze CAs, limitada
às provas locais. CI remoto, Preview e Supabase real permanecem sem validação.

## Direção técnica

A implementação segue o ADR-001: Next.js App Router, telas com Tailwind CSS,
sessão Supabase mantida no servidor com `@supabase/ssr` e acesso a dados de
domínio somente por tRPC. Nenhuma credencial, token ou chave de serviço deve
chegar ao cliente.

A apresentação de `/` e `/login` segue a tela 01 de `docs/layout.md`, conforme
o ADR-003. As rotas compartilham a mesma composição visual.

## Ordem aprovada para o pedido de implementação de papéis

T-01 já tem a interface. T-04 resolveu acesso no servidor; T-05 integrou os
middlewares e o endpoint. Depois vêm T-02 (formulário) e T-03
(renovação/proteção de páginas), cada uma com autorização própria.
Essa ordem permite construir autorização sem habilitar login ou páginas
protegidas incompletas. A spec inteira só termina após todas as tarefas.

### T-04 — Resolver acesso em suporte_ti

- Criar serviço exclusivo de servidor para receber a identidade já validada
  pelo provedor e resolver a Membership do usuário em suporte_ti usando Prisma.
- Sem identidade, recusar como UNAUTHORIZED; sem vínculo, FORBIDDEN genérico.
  Não escolher outra área como fallback e não consultar papel de outra área.
- Retornar apenas o contexto necessário de usuário/tenant/papel, sem tokens.
- Reutilizar Tenant e Membership existentes: nenhum DDL ou migration nova.
- Provar com PostgreSQL local isolado que o vínculo é filtrado por usuário e
  tenant, incluindo ADMIN em outra área e COLLABORATOR em suporte_ti.
- Usar as dependências existentes; não instalar bibliotecas como efeito colateral.

### T-05 — Ligar o contexto aos procedimentos

- Criar cliente Supabase SSR somente no servidor com cookies httpOnly, usando
  as variáveis já existentes. Verificar a identidade com API autenticada do
  provedor; não confiar apenas em sessão/cookie decodificado ou user_metadata.
- Montar createContext por request com identidade validada e o serviço T-04.
- Implementar protectedProcedure, tenantProcedure e adminProcedure com tRPC,
  seguindo Router → Service → Prisma e Zod conforme ADR-001.
- Expor o contrato mínimo de consulta do próprio contexto, sem catálogo ou
  função administrativa de negócio. Testar middlewares com createCaller,
  usuário/tenant/role explícitos e tentativas de falsificar contexto no input.
- Tokens, erros do provedor e detalhes de banco não chegam ao cliente.

Registro da execução: `auth.me` em `/api/trpc/auth.me` aceita consulta sem
campos de identidade e retorna somente userId/tenantId/role. `getUser` valida
a identidade; a resolução de acesso é reutilizada somente dentro do request,
com leitura de Membership em PostgreSQL real nos testes. Respostas usam cache
privado sem armazenamento, inclusive erros. As procedures administrativas de
prova existem somente nos testes; não há operação administrativa de negócio
publicada. Ver [evidências T-05](../../evidencias/login-t05-2026-11-09.md).

### T-02 — Envio de credenciais

Integrar formulário ao servidor via tRPC, mensagens genéricas e destino
autenticado definido na spec, mantendo a referência visual do ADR-003. O ADR-001
prevê React Hook Form e zodResolver, ainda ausentes no package.json; apresentar
dependências e impacto para autorização antes dessa tarefa, sem trocar o padrão.

Autorizadas e instaladas versões exatas react-hook-form 7.91.0 e
@hookform/resolvers 7.0.5. Implementar mutation `auth.login` com schema
compartilhado, cookie novo publicado após confirmar Membership e destino fixo
`/app` para o estado autenticado já previsto na spec. Validar Origin e JSON nas
mutações; não aceitar destino/tenant/papel do cliente. Preservar o layout de
login, cobrindo validação, envio desabilitado e mensagem genérica de falha.

### T-03 — Sessão e páginas

Implementar renovação e proteção com a convenção proxy da versão local do
Next, preservando cookies seguros e verificando acesso no servidor. Incluir
provas de navegação/sessão; teste de middleware isolado não substitui o fluxo.
Usar `src/proxy.ts`, propagando cookies renovados ao request e response, inclusive
redirects, com cache privado/no-store. O proxy verifica identidade; tRPC continua
responsável por Membership e dados. A tela mínima de estado em `/app` segue
ADR-002, pois ADR-003 se limita a inicial/login; não antecipar catálogo/Operações.

Para integração, testes Vitest iniciam Next e SDK SSR reais, provedor Auth
controlado em loopback e PostgreSQL descartável. A instalação adicional de
Playwright 1.65.0 foi rejeitada pela revisão automática por não constar da
aprovação específica; não foi instalada. Não substituir essa pendência por
afirmação de E2E automatizado no navegador.

## Validação

- Testes citam CAs: T-04 cobre resolução/isolamento; T-05 cobre matriz de acesso;
  T-02/T-03 completam autenticação real e comportamento de páginas.
- Não mockar Prisma para provar persistência ou RLS. Usar PostgreSQL local
  isolado conforme rules/tests.md, nunca banco remoto. O helper de T-04 cria
  container novo com porta aleatória em 127.0.0.1, aplica somente o histórico
  existente via Prisma Migrate e remove esse container ao terminar. O CI prepara
  a imagem postgres:17-alpine antes dos testes; não usa banco de produção.
- Executar os checks de rules/checks.md e declarar validação incompleta quando
  ambiente/credencial impedir algum deles. O terminal possui pnpm 11.25.0,
  enquanto projeto/CI fixam 11.19.0. Após autorização específica do operador,
  T-04 foi validada com `pnpm --package=pnpm@11.19.0 dlx pnpm <script>`.
  Reutilizar essa versão temporária nos checks, sem alterar dependências do app.
- Ao finalizar a spec, usar o verificador em contexto limpo com fontes completas;
  não reutilizar a prova antiga de CA-08 como aprovação dos novos CAs.

## Referências consultadas

- Guias locais do Next: cookies, Route Handlers e authentication em
  node_modules/next/dist/docs/01-app/. Cookies são assíncronos nesta versão.
- [Supabase SSR para Next](https://supabase.com/docs/guides/auth/server-side/nextjs):
  validar identidade no servidor e usar integração de cookies. O exemplo de
  Server Actions/cadastro público não é adotado, pois o ADR-001 e a spec os excluem.
- [Adapter Fetch do tRPC](https://trpc.io/docs/server/adapters/fetch) e
  [middlewares](https://trpc.io/docs/server/middlewares). A integração de cookies
  segue a assinatura de `@supabase/ssr` instalada (0.7.0), sem atualizar o SDK.

## Compatibilidade e segurança

- Preservar `/` e `/api/health`, que comprovam o andar zero.
- Não alterar schema nem migrations para a autenticação.
- Não expor token ao JavaScript e não criar autenticação simulada.
- Validar cada etapa conforme `rules/checks.md`.
