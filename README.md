# Equipamentos internos

Projeto de Inovação e Tecnologia iniciado em 14/09/2026.

Base inicial do sistema descrito em [PRD](docs/PRD.md), seguindo a [stack existente](docs/adr/001-stacks.md).

A estrutura inicial das tabelas está descrita na
[modelagem do banco](docs/database/initial-model.md). O SQL consolidado nessa
pasta é apenas uma fotografia para revisão; migrations continuam pertencendo ao
Prisma.

## Executar

Requisitos: Node.js 24, pnpm e PostgreSQL/Supabase para persistência. Com Docker, um único comando sobe aplicação e banco local:

```sh
pnpm local:up
```

Acesse `http://localhost:3000`; a página consulta `GET /api/health` e exibe o estado da conexão. Para encerrar sem apagar o volume:

```sh
pnpm local:down
```

Sem Docker, use um PostgreSQL já disponível:

```sh
pnpm install
pnpm db:generate
pnpm dev
```

A página inicial funciona sem credenciais de autenticação, não contém dados fictícios e não simula empréstimos.

Para preparar um banco de desenvolvimento, copie `.env.example` para `.env`, preencha as conexões e execute:

```sh
pnpm db:deploy
pnpm db:seed
```

O seed cria apenas o tenant `suporte_ti`, de forma idempotente. Não cria usuários ou senhas. Nunca utilize credenciais de produção nos testes.

## Verificar

```sh
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

O build usa Webpack para reproduzir na Vercel a compilação validada localmente.

## Implementado nesta etapa

- Next.js App Router, TypeScript strict, Tailwind, ESLint e Prettier.
- Modelagem Prisma com tenant, membership, equipamento, empréstimo e auditoria.
- Chaves estrangeiras compostas impedem associar empréstimos a equipamentos ou memberships de outro tenant.
- Política de empréstimo isolada e testável: até três itens, bloqueio por atraso, indisponibilidade e prazo de 14 dias completos.
- Singleton Prisma e validação das variáveis no primeiro acesso ao servidor.
- Docker Compose para subir o ambiente local completo.
- Health check de banco consumido pela página e coberto por teste de sucesso e indisponibilidade.
- Documentação do andar zero, regras operacionais e spec 001 de login.

Prisma permanece na versão 6 para preservar `directUrl` e a configuração de pool definidos no documento. A atualização para Prisma 7 exige outro ajuste de configuração e adapter. No Next 16 a renovação de sessão deverá usar `proxy.ts`, nome atual do middleware.

## Trabalho em andamento

O plano e o estado das tarefas de login ficam em
[`docs/specs/001-login`](docs/specs/001-login); o ponto exato de retomada da
sessão fica em [`handoff.md`](handoff.md). O README não duplica esses estados.

Esta etapa é a fundação, não o MVP funcional. Apenas o endpoint técnico `/api/health` está exposto; autenticação e endpoints de domínio ainda não foram implementados. RLS deny-by-default protege acessos pela API pública do Supabase; o proprietário das tabelas usado pelo Prisma pode ignorar RLS, portanto a autorização no servidor continua obrigatória.
