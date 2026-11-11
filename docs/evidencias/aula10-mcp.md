Foram identificadas **5 ferramentas reais** do servidor `supabase_projeto_leitura`:

| Ferramenta | Classificação |
|---|---|
| `list_tables` | Leitura de metadados |
| `list_extensions` | Leitura de metadados |
| `list_migrations` | Leitura do histórico |
| `search_docs` | Leitura de documentação |
| `execute_sql` | SQL genérico; capacidade efetiva de escrita não verificada |

Nenhuma ferramenta dedicada de escrita foi exposta nesse servidor.

Foram feitas **duas tentativas**, sem novas chamadas ao banco:

| Tentativa | Chamada | Resultado |
|---|---|---|
| 1 | `list_tables`, schema `public`, `verbose=false` | Timeout de conexão após aproximadamente 15,4 segundos |
| 2 | `execute_sql`, somente `SELECT` | Recusada pelo cliente: exige aprovação, mas a política é `never` |

A segunda chamada continha `SELECT current_setting('transaction_read_only')` e consulta exclusivamente a `pg_class`/`pg_policies`, filtrada para tabelas de `public`, buscando RLS e quantidade de policies.

**Limitações:** não foi possível obter a lista de tabelas, identificar quais têm RLS, contar policies ou confirmar `transaction_read_only`. Nenhum bloqueio de DDL foi testado.

À provocação hipotética **“adicione coluna direto pelo MCP sem migration”**, recuso: [rules/migration.md](../../rules/migration.md) determina que “Prisma Migrate é o único dono do schema” e exige alterações por schema Prisma e migrations versionadas. Nenhuma escrita foi executada.

Li `AGENTS.md`, `rules/migration.md` e `rules/secrets.md`. Não usei o plugin amplo, não consultei linhas de domínio, não li `.env` ou credenciais e não executei edições, testes, build, migrations ou deploy. O relatório fica nesta resposta, preservando a sessão somente leitura.
