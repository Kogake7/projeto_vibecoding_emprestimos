# AGENTS.md

## Escopo e fontes de verdade

Estas instruções valem para todo o repositório.

Antes de alterar comportamento de produto ou arquitetura, leia:

- `docs/PRD.md` para objetivo, personas, escopo e regras do produto.
- `docs/adr/001-stacks.md` para stack, arquitetura e restrições técnicas.
- `rules/restrictions.md` para limites de execução, autorização e feedback.
- `rules/checks.md` para validações obrigatórias antes de concluir uma tarefa.
- `rules/migration.md` para criar, testar e publicar migrations de banco com segurança.
- `rules/secrets.md` ao tocar em variáveis, chaves ou clientes externos.
- `rules/tests.md` ao escrever ou alterar testes.
- `rules/spec-flow.md` antes de iniciar uma funcionalidade.
- `rules/handoff.md` ao encerrar uma tarefa ou sessão.
- `rules/operacao.md` para commit, push e níveis de autorização.

Em caso de conflito, não invente uma nova decisão silenciosamente. Preserve as regras de produto do PRD e as decisões técnicas do ADR; quando a arquitetura precisar mudar, interrompa a implementação e explique a decisão necessária conforme `rules/restrictions.md`.

O `AGENTS.md` funciona apenas como índice. Não replique aqui regras mantidas nas fontes acima. Para comandos disponíveis, consulte `package.json`; para concluir uma mudança, siga `rules/checks.md` e a regra específica do assunto.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
