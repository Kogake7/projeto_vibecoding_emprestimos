Rodada `login-final-20261109-01`. Conferência limitada às fontes transcritas e ao resultado fornecido pelo principal. Não executei ferramentas, checks ou alterações.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | `src/server/auth/login-flow.test.ts:37` | SEM TESTE | Teste passou: autentica ambos os papéis, recebe `/app` e acessa a página com cookie. Porém não executa o redirecionamento do formulário implementado em `src/components/login-screen.tsx:74`. Falta prova executável dessa parte do CA. |
| CA-02 | `src/server/auth/login-flow.test.ts:75` | SEM TESTE | Teste passou: credenciais inválidas recebem respostas genéricas iguais. Não verifica permanência no login nem mensagem renderizada pelo formulário (`src/components/login-screen.tsx:78`). A observação manual não substitui esse teste. |
| CA-03 | `src/server/auth/login-flow.test.ts:90` | ATENDIDO | Teste passou: página, subcaminho e cookie inválido redirecionam para `/login`. Consistente com `src/server/auth/proxy.ts:47`. |
| CA-04 | `src/server/auth/login-flow.test.ts:111`; `src/server/auth/supabase.test.ts:37` | ATENDIDO | Testes passaram: renovação pelo SDK, cookie httpOnly e ausência de tokens no HTML/cabeçalhos legíveis. Consistente com `src/server/auth/supabase.ts:26` e `src/server/auth/proxy.ts:24`. |
| CA-05 | `src/server/api/authorization.test.ts:239`; `src/server/auth/login-flow.test.ts:157` | ATENDIDO | Testes passaram: ausência de vínculo recebe 403; ADMIN de outra área não obtém nova sessão. Resolução exige vínculo específico em `src/server/services/access.ts:38`. |
| CA-06 | `src/server/api/authorization.test.ts:147`; `src/server/api/authorization.test.ts:163`; `src/server/api/authorization.test.ts:275` | ATENDIDO | Testes passaram: isolamento na base de autorização, mutação limitada ao tenant resolvido e rejeição de contexto falsificado. Consistente com `src/server/services/access.ts:32` e `src/server/api/trpc.ts:36`. |
| CA-07 | `src/server/services/access.test.ts:49`; `src/server/api/authorization.test.ts:275`; `src/server/auth/supabase.test.ts:103` | ATENDIDO | Testes passaram: identidade validada, papel persistido e rejeição de tenant/papel no input. Consistente com `src/server/api/context.ts:34`, `src/shared/login.ts:3` e `src/server/services/access.ts:40`. |
| CA-08 | `src/components/login-screen.test.tsx:11` | ATENDIDO | Teste passou: somente formulário de entrada, sem ações ou links públicos de cadastro/convite. Consistente com `src/components/login-screen.tsx:197` e `src/server/api/routers/auth.ts:6`. |
| CA-09 | `src/server/api/authorization.test.ts:131`; `src/server/api/authorization.test.ts:172`; `src/server/api/authorization.test.ts:275` | ATENDIDO | Testes passaram: colaborador não lê nem altera pela procedure administrativa, inclusive com ADMIN em outra área ou input falsificado. Consistente com `src/server/api/trpc.ts:41`. |
| CA-10 | `src/server/api/authorization.test.ts:118`; `src/server/api/authorization.test.ts:147` | ATENDIDO | Testes passaram: ADMIN usa funções de colaborador e administrativas sem alterar outro tenant. A base reutilizável satisfaz o recorte definido em `docs/specs/001-login/spec.md:59`. |
| CA-11 | `src/server/services/access.test.ts:94`; `src/server/services/access.test.ts:111`; `src/server/api/authorization.test.ts:172` | ATENDIDO | Testes passaram: somente suporte_ti determina papel, em ambas as combinações de vínculos. Consistente com `src/server/services/access.ts:15` e `src/server/services/access.ts:40`. |

Os status `SEM TESTE` indicam ausência de cobertura executável **integral** do CA, apesar dos testes parciais aprovados. Não demonstram, por si, defeito na implementação.

Checks e limites:

- Testes selecionados: principal forneceu saída com **exit 0, cinco arquivos e 44 testes aprovados**.
- `pnpm db:generate`: sucesso registrado documentalmente em `docs/evidencias/login-t02-t03-2026-11-09.md:103`; sem saída executável fornecida nesta rodada.
- `pnpm test` completo: 54 testes registrados no mesmo documento:103; a saída fornecida nesta rodada cobre somente os 44 selecionados.
- `pnpm lint`: sucesso documental no mesmo documento:103; sem saída executável fornecida.
- `pnpm typecheck`: sucesso documental no mesmo documento:103; sem saída executável fornecida.
- `pnpm build`: sucesso documental no mesmo documento:104; a fixture também executa build local em `src/test-support/login-fixture.ts:166`.
- Navegador: revisão manual documentada no mesmo documento:79; não constitui teste executável citando CA para os comportamentos pendentes.
- CI remoto, Preview/Vercel e Supabase Auth real: não validados, conforme o mesmo documento:114.
- Nesta sessão: nenhum check executado, conforme a delegação.

Fora de escopo: não identifiquei implementação de funcionalidades excluídas nas fontes fornecidas. A página `/app` mostra somente estado de acesso (`src/components/access-screen.tsx:14`); procedures administrativas de prova ficam nos testes (`src/server/api/authorization.test.ts:19`). Sem diff/base e sem arquivos adicionais, não certifico ausência de alterações fora desse conjunto nem auditoria completa de segredos no bundle.

Faltam testes executáveis citando CA-01 e CA-02 que comprovem, respectivamente, navegação após envio e permanência/mensagem na interface após falha.

Veredito: NÃO PRONTA