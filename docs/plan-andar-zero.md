# Plano — andar zero

Plano preservado como evidência da ordem das aulas. Cada tarefa é verificável isoladamente.

- [x] T1 — configurar o projeto Next.js, TypeScript strict e Tailwind. Atende AZ-01 parcialmente. Verificação: `pnpm build`.
- [x] T2 — configurar Prisma e ambiente validado. Atende AZ-02 e AZ-07. Verificação: `pnpm db:generate` e teste do retorno 503.
- [x] T3 — versionar schema, migrations e seed idempotente. Atende AZ-03. Verificação: `pnpm db:deploy` e duas execuções de `pnpm db:seed` em banco descartável.
- [x] T4 — expor `GET /api/health`. Atende AZ-04. Verificação: teste cobre status e corpo.
- [x] T5 — consumir o health check na página inicial. Atende AZ-05. Verificação: abrir `http://localhost:3000` após `pnpm local:up`.
- [x] T6 — adicionar testes automatizados. Atende AZ-06. Verificação: `pnpm test`.
- [x] T7 — orquestrar aplicação e PostgreSQL. Completa AZ-01. Verificação: `pnpm local:up` numa máquina com Docker.
- [x] T8 — revisar ignore e exemplos de configuração. Atende AZ-08. Verificação: `git status --ignored` e busca por segredos.

## Organização de pastas

- `src/app` — interface e Route Handlers exigidos pelo App Router.
- `src/server` — ambiente, persistência e services que não entram no bundle cliente.
- `prisma` — fonte declarativa, migrations e seed.
- `docs` — produto, decisões e specs.
- `rules` — procedimentos e limites operacionais.

É a organização mais próxima das convenções do framework e mantém regras de negócio testáveis fora de componentes e handlers.
