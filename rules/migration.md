# Regras para migrations de banco de dados

> Leitor: agente

Este arquivo complementa `AGENTS.md`, `rules/restrictions.md` e `rules/checks.md`. Ele define como criar, revisar, testar e publicar migrations neste repositório.

## Estrutura atual

- O schema declarativo fica em `prisma/schema.prisma`.
- O histórico versionado fica em `prisma/migrations/<timestamp>_<nome>/migration.sql`.
- O seed fica em `prisma/seed.ts` e deve continuar idempotente.
- PostgreSQL no Supabase é o banco de dados.
- Prisma Migrate é o único dono do schema.
- `DATABASE_URL` atende o runtime pelo Supavisor, porta 6543, com `pgbouncer=true&connection_limit=1`.
- `DIRECT_URL` usa a conexão direta, porta 5432, para migrations.
- Objetos não representados pelo Prisma, como RLS, policies, triggers, checks e alguns índices, ficam em SQL dentro da migration.
- Snapshots `docs/database/*.snapshot.sql` podem existir apenas como artefatos
  consolidados de leitura, derivados das migrations e identificados como não
  executáveis. Eles nunca substituem o schema ou o histórico do Prisma.

## Fonte de verdade e proibições

- Alterar o schema somente por `prisma/schema.prisma` e migrations versionadas.
- Não alterar tabelas, colunas, constraints, enums, policies ou triggers manualmente no painel do Supabase.
- Não usar Supabase CLI, `prisma db push` ou scripts SQL avulsos como segundo dono do schema.
- Não executar, editar como fonte de schema nem publicar snapshots de
  `docs/database`; para aplicar a modelagem, usar exclusivamente as migrations
  Prisma com `pnpm db:deploy`.
- Não editar, renomear, reordenar ou excluir uma migration que já possa ter sido aplicada em qualquer ambiente compartilhado.
- Não usar `prisma migrate reset` fora de banco local ou de teste descartável e explicitamente identificado.
- Não executar `prisma migrate dev` nem comandos DDL contra produção.
- Não colocar credenciais ou URLs reais de banco em migrations, seed, logs ou documentação.
- Não modificar ADR como efeito colateral de uma migration. Qualquer alteração
  no ADR é uma decisão separada e exige autorização explícita.

Se uma migration aplicada estiver errada, criar uma nova migration corretiva. Nunca reescrever o histórico compartilhado.

## Quando criar uma migration

Crie uma migration para qualquer mudança persistente, incluindo:

- tabela, coluna, enum, chave, índice ou constraint;
- relacionamento ou regra de exclusão/atualização;
- RLS, policy, trigger ou função SQL;
- backfill ou transformação de dados necessária para um novo contrato;
- alteração no dado inicial exigido pelo sistema quando um simples seed idempotente não for suficiente.

Não crie migration para refatoração de TypeScript, mudança visual, ajuste de teste ou alteração que não modifique o contrato persistido.

## Nome e escopo

- Use um nome curto, descritivo e em `snake_case`, por exemplo `add_equipment_serial_number`.
- Mantenha uma finalidade coerente por migration.
- Não misture mudança de schema, limpeza independente e remoção destrutiva na mesma migration.
- Deixe o timestamp ser gerado pelo Prisma; não invente nem reutilize timestamps manualmente.

## Fluxo de desenvolvimento

1. Ler `prisma/schema.prisma`, todas as migrations existentes e o código que usa as entidades afetadas.
2. Identificar dados existentes, compatibilidade com a versão implantada, impacto por tenant e ordem de deploy.
3. Alterar `prisma/schema.prisma` somente no escopo autorizado.
4. Formatar e validar o schema:

   ```bash
   pnpm exec prisma format
   pnpm exec prisma validate
   ```

5. Gerar a migration sem aplicá-la inicialmente:

   ```bash
   pnpm exec prisma migrate dev --name <nome_da_migration> --create-only
   ```

6. Revisar integralmente o `migration.sql` gerado.
7. Adicionar manualmente no mesmo SQL os objetos necessários que o Prisma não representa, como RLS, policies, triggers, checks e índices parciais.
8. Aplicar somente em banco local ou de teste descartável:

   ```bash
   pnpm db:migrate
   ```

9. Regenerar o Prisma Client, atualizar seed, services e testes afetados.
10. Executar os checks de `rules/checks.md` e revisar o diff completo.

Gerar a migration e aplicá-la são partes da mesma tarefa apenas quando o alvo é um banco local ou de teste claramente descartável. Aplicar em ambiente compartilhado ou produção exige autorização específica.

## Revisão obrigatória do SQL

Antes de aplicar, conferir:

- ausência de `DROP`, truncamento, recriação de tabela ou conversão com perda não planejada;
- valores padrão e nulabilidade de novas colunas;
- tratamento dos registros que já existem;
- nomes e ordem de criação de foreign keys;
- comportamento `ON DELETE` e `ON UPDATE`, mantendo `RESTRICT` quando for o padrão do domínio;
- índices para foreign keys, filtros, unicidade por tenant e paginação por cursor;
- constraints de domínio que protegem invariantes mesmo fora da aplicação;
- locks prolongados, scans completos e reescrita de tabela;
- comandos que não possam rodar dentro da transação esperada;
- compatibilidade do SQL com a versão do PostgreSQL usada pelo Supabase.

SQL manual deve ser determinístico, legível e fazer parte do arquivo `migration.sql`; não dependa de uma operação posterior no painel.

## Multi-tenancy e RLS

Toda nova tabela de domínio deve:

- possuir `tenant_id` do tipo UUID e não nulo no estado final;
- ter relacionamento com `Tenant` usando a chave apropriada;
- usar chaves e unicidade compostas por tenant quando o identificador for de escopo local;
- incluir `tenant_id` nos índices usados pelas consultas;
- habilitar Row Level Security;
- nascer sem policy pública, mantendo deny-by-default;
- ser acessada no servidor com o tenant derivado da sessão, nunca do input do cliente.

Para tabelas existentes que ainda não tenham `tenant_id`, não adicione a coluna obrigatória de uma vez. Use rollout em etapas: coluna nula, backfill validado, constraints e `NOT NULL` em migration posterior.

Sempre testar que tenant A não consegue ler, relacionar, atualizar nem excluir dados do tenant B. Foreign keys compostas devem impedir associações entre tenants.

## Auditoria

- Preserve `AuditEvent` como append-only.
- Não remova nem enfraqueça `prevent_audit_change` ou seu trigger.
- Novas operações relevantes devem registrar ator, tenant, ação, recurso e data.
- Alterações em tabelas auditadas devem considerar como eventos antigos continuarão sendo interpretados.
- Backfills administrativos não devem falsificar a identidade de um usuário; documente a origem técnica quando auditoria for necessária.

## Dados existentes e backfills

- Nunca presumir banco vazio.
- Antes de tornar um campo obrigatório, garantir que todos os registros existentes tenham valor válido.
- Preferir backfills idempotentes, reiniciáveis e limitados por condição, por exemplo `WHERE campo IS NULL`.
- Para volume relevante, executar backfill em lotes fora de uma transação longa e adicionar a constraint somente depois.
- Não usar o seed para migrar dados de produção.
- O seed pode criar dados iniciais por `upsert`, mas não deve apagar, substituir ou duplicar dados existentes.
- Executar o seed duas vezes no ambiente de teste e confirmar o mesmo estado final.

## Compatibilidade e rollout

Como a migration pode ser aplicada antes da nova aplicação, a versão anterior precisa continuar funcionando com o schema migrado.

Use a estratégia expandir/migrar/contrair para mudanças incompatíveis:

1. **Expandir:** adicionar estruturas novas sem remover nem tornar inválidas as antigas.
2. **Migrar:** publicar código compatível, preencher dados e passar a ler/escrever o novo contrato.
3. **Contrair:** em uma entrega posterior, depois de comprovar que nada usa o contrato antigo, removê-lo.

Renomear coluna ou enum deve ser tratado como mudança incompatível. Prefira adicionar, copiar/backfill, migrar o código e remover depois. Não faça remoção destrutiva no mesmo deploy em que o uso antigo desaparece.

## Validação em banco real

Migrations devem ser testadas em PostgreSQL real, preferencialmente com Testcontainers ou ambiente de preview isolado. Não use mock do Prisma para validar schema.

Verifique:

- aplicação do histórico completo em banco vazio;
- upgrade de um snapshot representativo da versão anterior;
- preservação dos dados;
- execução repetida do seed;
- constraints, relacionamentos, índices, triggers e RLS;
- isolamento entre dois tenants;
- funcionamento da versão anterior após a migration;
- funcionamento da nova versão após a migration;
- tempo de execução e locks em volume representativo.

Depois, execute o checklist mínimo de `rules/checks.md`; não mantenha uma
segunda cópia dos mesmos comandos neste arquivo.

## Preview, CI e produção

- Em Preview, usar banco isolado ou branch de banco autorizado; nunca apontar um preview para produção para testar DDL.
- Revisar o Preview Deployment da Vercel e executar os smoke tests de `rules/checks.md`.
- Com autorização explícita para a migration e o ambiente de produção exatos,
  avisar sobre o impacto e usar somente:

  ```bash
  pnpm db:deploy
  ```

- `db:deploy` deve rodar uma vez em job controlado antes do novo deploy da aplicação, nunca durante o boot de uma function da Vercel.
- Confirmar backup ou mecanismo de recuperação antes de migration destrutiva ou backfill de alto risco.
- Monitorar resultado da migration, deploy, logs de runtime e fluxos afetados.

Estado atual do repositório: `.github/workflows/ci.yml` executa geração do Prisma, testes, lint, typecheck e build, mas não executa `pnpm db:deploy`. Portanto, não presumir que migrations de produção estão automatizadas. Criar ou alterar esse job é uma tarefa separada e requer autorização.

## Falha e recuperação

- Interromper o deploy se a migration falhar.
- Não marcar migration como aplicada manualmente sem verificar o estado real do banco e compreender a falha.
- Não apagar registros da tabela de migrations do Prisma para forçar uma nova execução.
- Preferir roll-forward com uma nova migration corretiva.
- Se houver risco de perda, parar e preservar evidências antes de qualquer tentativa de correção.
- Uma restauração de backup, `migrate resolve` ou intervenção manual em produção exige diagnóstico, alvo exato e autorização específica.

## Evidência no feedback

Ao concluir uma tarefa de migration, informar:

- migration criada e finalidade;
- ambientes em que foi aplicada;
- SQL manual adicionado;
- estratégia de compatibilidade e tratamento dos dados existentes;
- validação de tenant, RLS e auditoria;
- comandos e testes executados;
- resultado do Preview Deployment, quando aplicável;
- riscos residuais, etapa de contração futura e checks pendentes.

Nunca afirmar que uma migration está segura para produção apenas porque foi gerada pelo Prisma ou aplicada em banco vazio.
