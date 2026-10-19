# Andar zero — prova do ADR-001

Isto não é uma spec: não descreve comportamento de produto. É a verificação de que a stack definida em `docs/adr/001-stacks.md` funciona de ponta a ponta numa máquina limpa.

## Critérios de aceitação

- AZ-01 — `pnpm local:up` sobe aplicação e PostgreSQL com Docker Compose.
- AZ-02 — a aplicação conecta no banco; sem banco, `/api/health` responde com erro explícito.
- AZ-03 — existem migrations Prisma versionadas e aplicáveis em banco vazio.
- AZ-04 — `GET /api/health` responde 200 e informa o estado da conexão.
- AZ-05 — a página inicial consulta e apresenta o resultado de `/api/health`.
- AZ-06 — `pnpm test` executa a suíte e testa sucesso e falha do health check.
- AZ-07 — a configuração vem de variáveis de ambiente documentadas em `.env.example`.
- AZ-08 — `.env` está ignorado e nenhum segredo real é versionado.

## Fora de escopo

Login, catálogo, solicitação, devolução e telas administrativas. A modelagem de domínio existente prepara o banco, mas nenhuma dessas funcionalidades está exposta.

## Organização registrada

O App Router fica em `src/app`; código exclusivo do servidor fica em `src/server`; schema, migrations e seed ficam em `prisma`. Essa organização segue o Next.js e a separação Router → Service → Prisma definida no ADR-001.
