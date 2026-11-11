Conferência da rodada `20261111-final-002`, limitada às fontes transcritas. Não executei ferramentas, checks ou alterações. Os resultados de CI são atestados pelo principal; não autentiquei o GitHub nem conferi o recibo independentemente.

| CA | evidência (arquivo:linha do teste) | status | observação |
| --- | --- | --- | --- |
| CA-01 | `src/server/services/initial-data.test.ts:37` | ATENDIDO | Suíte passou no CI fornecido. Compara os doze nomes/categorias e os estados iniciais. Consistente com criação transacional em `src/server/services/initial-data.ts:24` e `:48`. |
| CA-02 | `src/server/services/initial-data.test.ts:72` | ATENDIDO | Teste passou; compara equipamentos, empréstimos e auditoria antes/depois. Código cria apenas ausentes e preserva existentes em `src/server/services/initial-data.ts:45`. |
| CA-03 | `src/server/services/initial-data.test.ts:116` e `:152` | ATENDIDO | Testes passaram; conflitos de nome/categoria e patrimônio extra preservam o conjunto. Validação antecede criação em `src/server/services/initial-data.ts:34`, dentro da transação. |
| CA-04 | `src/server/services/initial-data.test.ts:172`, `:187`, `:202` e `:243` | SEM TESTE | Testes passaram para ADMIN, papel conflitante, empréstimos e formato da identidade. Entretanto, recebem identidade sintética diretamente: não exercitam a consulta a `auth.users` em `scripts/provisionar-professor.ts:27`. Falta teste citando CA-04 que prove a exigência de identidade existente e correspondente ao UUID/e-mail antes do vínculo. |
| CA-05 | `src/server/services/initial-data-target.test.ts:8` e `:82` | ATENDIDO | Os 17 testes passaram; cobrem confirmação, divergência e mensagem sem credenciais. Guarda antecede instanciação do Prisma em `prisma/seed.ts:15` e `scripts/provisionar-professor.ts:20`; ambos capturam falhas com mensagem fixa. |
| CA-06 | `src/server/services/initial-data.test.ts:260` | ATENDIDO | Teste passou; preserva tenant, equipamento, membership, empréstimo e auditoria externos após inventário e recusa. Consultas de inventário e vínculo são delimitadas em `src/server/services/initial-data.ts:30` e `:88`. |
| CA-07 | `src/server/services/initial-data.test.ts:37` | SEM TESTE | O teste passou, mas verifica somente termos de busca não vazios (`:67`), sem comparar os termos originais. Os testes de metadados citam exclusivamente **Spec 003 CA-10**, em `src/shared/equipment-images.test.ts:37`; não comprovam integralmente CA-07 conforme a exigência de identificação. |

Checks fornecidos pelo principal, executados no GitHub Actions no commit `e72e3f96deba9d78e41c4047cc3616dc52a42c0a`:

- `pnpm db:generate`: passou.
- `pnpm test --maxWorkers=1 --no-file-parallelism`: passou; 13 arquivos, 120 testes.
- `pnpm lint`: passou.
- `pnpm typecheck`: passou.
- `pnpm build`: passou.
- `pwsh -File scripts/tests/verificador-runtime.test.ps1`: passou; 17 casos técnicos e 38 casos de entradas/recibos/imagens.

Há também uma inconsistência documental: a skill condiciona copiar o manifesto à conferência das URLs públicas (`skills/imagens-equipamentos/SKILL.md:51`), mas o manifesto já contém doze destinos enquanto a evidência registra upload e conferência remota pendentes (`docs/evidencias/imagens-20261111.md:89`). Isso precisa ser reconciliado sem alegar publicação inexistente.

Fora de escopo: não identifiquei funcionalidade adicional nas fontes analisadas. Catálogo/solicitação pertencem à spec 003, e o preparo fotográfico à skill, conforme `docs/specs/002-dados-iniciais/spec.md:12`. Não recebi diff/base para conferir alterações além do snapshot.

Não feitos nesta sessão: todos os checks executáveis, autenticação do CI, conferência independente de hashes, inspeção dos JPEGs, Preview/Vercel, GETs do Storage e provisionamento remoto. O helper `src/test-support/postgres` também não foi fornecido para conferir diretamente o destino e a aplicação das migrations.

Veredito: NÃO PRONTA

Faltam provas executáveis completas identificadas para CA-04 e CA-07, além da reconciliação do procedimento de publicação do manifesto.