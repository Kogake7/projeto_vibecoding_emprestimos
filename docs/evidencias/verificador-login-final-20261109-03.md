Rodada `login-final-20261109-03`. Conferência limitada às fontes fornecidas. Não executei comandos, não editei arquivos e não usei ferramentas externas. Os resultados de execução são do principal.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | `src/server/auth/login-flow.test.ts:37`; `src/test-support/login-browser-checks.ts:74` | ATENDIDO | HTTP comprova sessão para ambos os papéis; navegador comprova envio e navegação a `/app`. Consistente com `src/server/services/login.ts:43` e `src/components/login-screen.tsx:74`. |
| CA-02 | `src/server/auth/login-flow.test.ts:75`; `src/test-support/login-browser-checks.ts:48`; `src/components/login-screen.test.tsx:11` | ATENDIDO | Senha incorreta e e-mail inexistente produzem resposta genérica, permanência no login e limpeza da senha. Formulário usa POST, conforme `src/components/login-screen.tsx:197`. |
| CA-03 | `src/server/auth/login-flow.test.ts:90` | ATENDIDO | Ausência de sessão e cookie inválido redirecionam ao login, incluindo subcaminho. Consistente com `src/server/auth/proxy.ts:47`. |
| CA-04 | `src/server/auth/login-flow.test.ts:111`; `src/server/auth/supabase.test.ts:37` | ATENDIDO | Renovação exercita SDK SSR e proxy; verifica cookies httpOnly e ausência de tokens no HTML e cabeçalhos legíveis. Proteção imposta em `src/server/auth/supabase.ts:26`. |
| CA-05 | `src/server/api/authorization.test.ts:239`; `src/server/services/access.test.ts:80`; `src/server/auth/login-flow.test.ts:157` | ATENDIDO | Identidade sem vínculo recebe FORBIDDEN; ADMIN de outra área também é recusado, sem publicação da nova sessão. Consistente com `src/server/services/access.ts:32` e `src/server/services/login.ts:46`. |
| CA-06 | `src/server/api/authorization.test.ts:147`; `src/server/api/authorization.test.ts:163`; `src/server/api/authorization.test.ts:275` | ATENDIDO | Leitura de contexto e mutação de prova ficam no tenant resolvido; falsificação é recusada. Resolução usa chave composta em `src/server/services/access.ts:38`. |
| CA-07 | `src/server/services/access.test.ts:49`; `src/server/api/authorization.test.ts:275`; `src/server/auth/supabase.test.ts:103` | ATENDIDO | Papel vem da Membership; input, metadados e contexto anterior não substituem a resolução no servidor. Consistente com `src/server/api/context.ts:34` e `src/server/services/access.ts:61`. |
| CA-08 | `src/components/login-screen.test.tsx:18` | ATENDIDO | Teste verifica ações, links e campos, sem cadastro ou convite público. Consistente com `src/components/login-screen.tsx:293` e router em `src/server/api/routers/auth.ts:6`. |
| CA-09 | `src/server/api/authorization.test.ts:131`; `src/server/api/authorization.test.ts:172`; `src/server/api/authorization.test.ts:275` | ATENDIDO | COLLABORATOR não lê nem executa mutação administrativa; declaração de ADMIN não promove acesso. Middleware exige papel persistido em `src/server/api/trpc.ts:41`. |
| CA-10 | `src/server/api/authorization.test.ts:118`; `src/server/api/authorization.test.ts:147` | ATENDIDO | ADMIN usa funções de colaborador e administrativas; mutação preserva outro tenant. Consistente com encadeamento em `src/server/api/trpc.ts:36`. |
| CA-11 | `src/server/services/access.test.ts:94`; `src/server/services/access.test.ts:111`; `src/server/api/authorization.test.ts:172` | ATENDIDO | Vínculos múltiplos não promovem nem reduzem o papel de suporte_ti. Consulta fixa esse tenant em `src/server/services/access.ts:15`. |

Todos os testes citados do Vitest pertencem à execução fornecida: **45 testes passaram em cinco arquivos, exit 0**. Os quatro casos adicionais de navegador constam como PASSED em `docs/evidencias/login-browser-ca01-ca02-2026-11-09.md:28`; os hashes registrados correspondem às fontes desta rodada.

Checks conferidos, executados pelo principal:

- `pnpm test` com os cinco arquivos indicados: passou, saída executável fornecida.
- `pnpm db:generate`: passou conforme registro em `docs/evidencias/login-t02-t03-2026-11-09.md:103`.
- `pnpm test` completo: 55 testes passaram conforme registro em `docs/evidencias/login-t02-t03-2026-11-09.md:145`.
- `pnpm lint`: passou conforme registro em `docs/evidencias/login-t02-t03-2026-11-09.md:103`.
- `pnpm typecheck`: passou conforme o mesmo registro.
- `pnpm build`: passou conforme `docs/evidencias/login-t02-t03-2026-11-09.md:104`; o registro final confirma navegador reexecutado no build corrigido em `:145`.
- Navegador automatizado: quatro casos passaram; evidência adicional ao Vitest, sem comprovação de job E2E no CI.

Não identifiquei implementação de funcionalidades fora da spec nas fontes fornecidas. O AppRouter publica somente autenticação (`src/server/api/root.ts:6`); operações administrativas de prova ficam nos testes (`src/server/api/authorization.test.ts:19`). Não há nova estrutura persistente de autenticação. Sem diff/base fornecidos, não atesto ausência de alterações em arquivos externos ao snapshot.

Nenhum check foi executado nesta sessão, conforme a delegação. CI remoto, Preview/Vercel e Supabase Auth real não foram validados pelo principal (`docs/evidencias/login-t02-t03-2026-11-09.md:114`). A aprovação limita-se à implementação e às provas locais; não comprova funcionamento implantado.

Os onze CAs têm testes executáveis que os citam, resultados positivos e implementação consistente nas fontes fornecidas.

Veredito: PRONTA