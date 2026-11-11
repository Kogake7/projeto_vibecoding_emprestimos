Rodada `20261111-final-003`. Análise somente das fontes numeradas, imagens anexadas e resultados fornecidos pelo principal. Não executei ferramentas, checks ou alterações.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | `src/server/api/loans.test.ts:115`; `src/components/equipment-workspace.test.tsx:54` | ATENDIDO | Testes passaram no CI: estados, paginação e recusa de cursor estrangeiro. Implementação filtra tenant e retorna patrimônio, nome, categoria e situação em `src/server/services/equipment.ts:20`; apresentação distingue e bloqueia indisponíveis em `src/components/equipment-workspace.tsx:102`. |
| CA-02 | `src/server/api/loans.test.ts:145`; `src/server/api/loans.test.ts:439` | ATENDIDO | Testes passaram: criação imediata, identidade própria, datas, situação, auditoria e projeção do retorno. A procedure não recebe datas ou identidade (`src/server/api/routers/loans.ts:13`); as escritas estão na transação em `src/server/services/loans.ts:117`. |
| CA-03 | `src/server/api/loans.test.ts:174`; `src/server/api/loans.test.ts:207`; `src/components/equipment-workspace.test.tsx:100` | ATENDIDO | Testes passaram: terceiro permitido, quarto recusado, devolvidos ignorados, atraso bloqueado e limite igual para ambos os papéis. Código aplica política sem exceção por papel em `src/server/services/loan-policy.ts:28`. |
| CA-04 | `src/server/services/business-calendar.test.ts:8`; `src/server/services/loan-policy.test.ts:37` | ATENDIDO | Suítes passaram: contagem inclusiva, feriados, fins de semana, virada de ano, preservação do horário e recusa fora da cobertura. Consistente com `src/server/services/business-calendar.ts:94` e `src/server/services/business-calendar.ts:129`. |
| CA-05 | `src/server/api/loans.test.ts:229`; `src/server/api/loans.test.ts:252` | ATENDIDO | Testes passaram: manutenção e empréstimo recusados sem alterações; inexistente e estrangeiro recebem a mesma resposta. Filtro e recusa precedem as escritas em `src/server/services/loans.ts:88`. |
| CA-06 | `src/server/api/loans.test.ts:275`; `src/server/api/loans.test.ts:299`; `src/server/api/loans.test.ts:327` | ATENDIDO | Testes passaram em PostgreSQL real: concorrência no item, limite por usuário e rollback por falha real na auditoria. Código usa locks, transação Serializable e repetição limitada em `src/server/services/loans.ts:75`. |
| CA-07 | `src/server/api/loans.test.ts:99`; `src/server/api/loans.test.ts:115`; `src/server/api/loans.test.ts:374`; `src/server/api/loans.test.ts:400` | ATENDIDO | Testes passaram: sessão, Membership, isolamento, cursores e identidade forjada. Contexto deriva acesso da identidade verificada (`src/server/api/context.ts:32`); schemas são estritos (`src/shared/loans.ts:3`). |
| CA-08 | `src/server/api/loans.test.ts:374`; `src/components/equipment-workspace.test.tsx:91`; `src/components/equipment-workspace.test.tsx:100` | ATENDIDO | Testes passaram: ADMIN recebe somente seus abertos, cursores de terceiros são recusados, datas e atraso são apresentados. Filtros obrigatórios em `src/server/services/loans.ts:17`; apresentação em `src/components/equipment-workspace.tsx:150`. |
| CA-09 | `src/components/equipment-workspace.test.tsx:45`; `src/components/equipment-workspace.test.tsx:70`; `src/components/equipment-workspace.test.tsx:77` | SEM TESTE | Os testes passaram, mas cobrem apenas renderização estática de acesso, bloqueio e envio. Não exercitam vazio, erro, sucesso, clique repetido nem atualização efetiva das listas após mutação. Os handlers existem em `src/components/equipment-workspace.tsx:257` e `src/components/equipment-workspace.tsx:297`, mas leitura não comprova o comportamento completo. |
| CA-10 | `src/shared/equipment-images.test.ts:37`; `src/components/equipment-workspace.test.tsx:83` | REPROVADO | Os três testes de imagens passaram e comprovam o pacote local; examinei também as doze imagens anexadas. Porém, a interface usa URLs remotas (`src/components/equipment-workspace.tsx:31`), cujo upload e funcionamento permanecem pendentes conforme `docs/evidencias/imagens-20261111.md:89`. Não há prova de que os doze itens exibam essas fotos nem teste do crédito visível em `src/components/equipment-workspace.tsx:511`. O teste de componente exercita somente foto pendente. |
| CA-11 | `src/server/api/loans.test.ts:99`; `src/server/api/loans.test.ts:174`; `src/server/api/loans.test.ts:439`; `src/components/equipment-workspace.test.tsx:45` | SEM TESTE | Há testes aprovados de autorização e regras por papel, mas falta teste citando este CA que exercite catálogo e empréstimos nas duas telas e o redirecionamento das rotas diretas. `src/server/auth/login-flow.test.ts:90` verifica redirecionamento sob outro CA, sem testar explicitamente `/app/meus-emprestimos`. O proxy é consistente com a proteção em `src/server/auth/proxy.ts:9`. |

Checks conferidos pelo log fornecido do [GitHub Actions, run 42992919261](https://github.com/Kogake7/projeto_vibecoding_emprestimos/actions/runs/42992919261), commit `e72e3f96deba9d78e41c4047cc3616dc52a42c0a`:

- `pnpm test --maxWorkers=1 --no-file-parallelism`: aprovado, 13 arquivos e 120 testes.
- `pnpm db:generate`: aprovado.
- `pnpm lint`: aprovado.
- `pnpm typecheck`: aprovado.
- `pnpm build`: aprovado.
- `pwsh -File scripts/tests/verificador-runtime.test.ps1`: aprovado, 17 casos técnicos e 38 casos de entradas/recibos/imagens.

A origem e a equivalência dos fontes com os blobs são atestadas pelo principal; não autentiquei o GitHub nem recalculei o hash do recibo nesta sessão.

Não foram comprovados: navegador para o fluxo da spec 003, Preview Vercel, GETs públicos das doze fotos, compatibilidade contra a versão implantada e revisão integral do diff. A evidência de navegador fornecida cobre login (`docs/evidencias/login-browser-ca01-ca02-2026-11-09.md:28`). A suíte Python é resultado documental separado, não etapa demonstrada nesse log de CI (`docs/evidencias/imagens-20261111.md:82`).

Fora de escopo: não identifiquei implementação de reserva, devolução ou painel de Operações nos fontes fornecidos. Sem diff/base, não é possível certificar ausência de alterações adicionais. As tarefas T-02 a T-06 continuam abertas em `docs/specs/003-solicitar-emprestimo/tasks.md:8`.

Faltam provas executáveis completas dos critérios de interface e rotas, além da disponibilidade das fotos efetivamente consumidas.

Veredito: NÃO PRONTA