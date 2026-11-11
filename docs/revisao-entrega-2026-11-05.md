# Revisão para entrega — 05/11/2026

## Parecer

O projeto demonstra aplicação dos conceitos das aulas disponíveis, mas não comprova conclusão integral das aulas 7 a 11. Pode ser apresentado como entrega parcial: fundação técnica, modelagem e interface inicial; não como sistema de empréstimos funcional.

Esta revisão compara o repositório com os cinco HTMLs em `aulas/`. Materiais das aulas 1 a 6 não foram encontrados; não é possível certificar seu atendimento. A existência de um documento não prova que seu procedimento foi executado ou aprovado na ordem exigida.

## Comparação por aula

| Aula | Evidências existentes | Pendências e conclusão |
| --- | --- | --- |
| 7 — SDD | PRD; ADR-001 com escolhas e alternativas; spec 001 com objetivo, vínculo, regras, CA-01 a CA-08, contrato e exclusões; plano e tarefas separados. | A seção de perguntas da spec tem cinco itens classificados, mas não registra o “por que importa” de cada pergunta no formato da entrega. Também não prova validação das respostas pelo negócio. Estrutura amplamente atendida, evidência do processo parcial. |
| 8 — Greenfield | `docs/andar-zero.md`, `docs/plan-andar-zero.md`, Docker Compose, endpoint de saúde, migrations, seed, exemplo de ambiente e testes. A spec explica quais garantias herda do andar zero. | Não foi possível repetir AZ-01/03 em banco vazio: Docker indisponível. Os testes do health usam uma função de conexão substituta; não provam conexão real. As tarefas AZ marcadas como concluídas não bastam como prova atual. Histórico recente tem mensagens genéricas “Tela Inicial”; não demonstra a granularidade proposta pela aula. |
| 9 — Regras | AGENTS como índice e oito arquivos em `rules/`, com comandos e responsabilidades adaptados ao Prisma. Spec lista DDL esperado e regras acionadas. | Não foram encontrados registros das provocações de migration, produção e sessão longa. `migration.md` prevê gerar SQL e revisá-lo, mas não explicita o passo da aula de mostrar a proposta de DDL e parar antes de gerar a migration; `operacao.md` exige autorização, sem definir esse artefato prévio. A fatia de login reutiliza schema, enquanto o exercício pede uma fatia que exercite mudança de schema: explicar essa adaptação ao professor. Algumas regras excedem bastante a orientação de concisão. |
| 10 — Skills e MCP | Uma skill em `skills/revisar-interface-empres-ti/SKILL.md`, com nome igual à pasta, gatilho, procedimento e referências; descoberta pelo AGENTS. `.mcp.json` fixa projeto, leitura e grupos de banco/documentação; `docs/mcp.md` descreve as provas. | Configuração não comprova carregamento no cliente, OAuth nem consulta real. O próprio handoff registra as provas como pendentes. Não foram encontrados resultados dos testes de ativação/limite da skill nem auditoria detalhada das ferramentas do MCP. Aula parcialmente atendida. |
| 11 — Subagentes | `agents/verificador-spec.md` define entradas, leitura, tabela por CA e proibição de editar; AGENTS oferece alternativa por sessão limpa. | A adoção está explicitamente inicial: `rules/spec-flow.md` ainda não exige verificação antes de concluir a spec e a description não contém o gatilho automático de fim de spec. Não há tabela produzida pelo verificador nem evidências das quatro provas da aula. Aula iniciada, não concluída. |

## Estado real do produto

- `/` e `/login` compartilham uma interface responsiva com o botão Entrar desabilitado e aviso explícito. T-01 está marcada como feita; T-02 a T-04 permanecem abertas.
- CA-01 a CA-07 não têm implementação completa nem testes identificados. CA-08 aparece na interface pela ausência de cadastro público, mas não tem teste automatizado que o cite.
- Catálogo, solicitação, devolução e painel de Operações não foram implementados. Não há procedures tRPC de domínio, contexto autenticado ou renovação de sessão.
- A política isolada cobre terceiro/quarto item, atraso, manutenção, item emprestado e prazo. Ela ainda não está ligada a um fluxo persistido de empréstimo.
- Banco modela Tenant, Membership, Equipment, Loan e AuditEvent. Migrations incluem chaves compostas, unicidade de empréstimo aberto, checks de datas, RLS e trigger append-only. A efetividade em banco real não foi repetida nesta revisão.
- Testes atuais não exercitam isolamento entre tenants, RLS, migrations ou navegação no navegador. A suíte verde tem alcance limitado aos dez casos existentes.
- A identidade escura EmpresTI está autorizada pelo ADR-003 para `/` e `/login`, substituindo as decisões correspondentes do ADR-002. Isso não é uma divergência de tema sem documentação.

## Pontos de atenção técnicos

1. A spec fala em membership “ativa”, mas o schema não possui indicador de atividade; “primeira membership” também não define ordenação. Resolver essas ambiguidades antes de T-04.
2. O ADR-001 prevê validação de ambiente no boot; `getServerEnv()` faz validação sob demanda. O README declara essa adaptação, mas não substitui uma decisão arquitetural formal.
3. CI executa qualidade, mas não aplica migrations, conforme já reconhecido em `rules/migration.md`. Não foram verificados resultados remotos de CI ou implantação.
4. React Hook Form, Testing Library, Testcontainers, Playwright, Sentry, husky e lint-staged previstos no ADR ainda não estão instalados/configurados. Avaliar cada um na etapa pertinente; dependências tRPC/Supabase instaladas não equivalem a integração pronta.
5. Node local é 24.22.1, compatível com o projeto. pnpm local é 11.25.0; projeto e CI fixam 11.19.0. Repetir a instalação/validação com a versão fixada para comprovar reprodução exata.

## Validação desta revisão

- `pnpm test`: passou; 2 arquivos e 10 testes.
- `pnpm lint`: iniciado, mas permaneceu sem resultado e foi interrompido após vários minutos. A tentativa direta do ESLint também não terminou. Não foi obtido diagnóstico de falha de código.
- `pnpm typecheck` e `pnpm build`: não alcançados na sequência interrompida. A tentativa direta, que executaria tipos após lint, também foi interrompida antes de produzir resultado. Portanto, estes checks ficam pendentes.
- Docker: servidor indisponível; não foram executadas migrations, seed ou reset.
- Não foram realizados testes de interface móvel/desktop no navegador, OAuth/MCP, CI remoto ou Preview Vercel. Nenhum ambiente externo foi alterado.
- `.env` não consta entre os arquivos atualmente rastreados; isso não certifica ausência de segredos em todo o histórico Git.

## Como apresentar e empacotar

Apresentar como “base técnica e tela inicial do sistema EmpresTI, com autenticação e funcionalidades do MVP em desenvolvimento”. Preservar a lista de pendências, sem marcar tarefas incompletas como concluídas.

O ZIP deve incluir código, assets e licenças, `prisma/`, `docs/`, `rules/`, `skills/`, `agents/`, materiais das aulas, README, AGENTS, handoff, lockfile e configurações, incluindo `.github/`, `.mcp.json` e `.env.example`. Arquivos ainda não commitados também são parte do estado atual e precisam entrar; um arquivo gerado apenas a partir do último commit os perderia.

Excluir `.env` e variantes com valores reais, `.git/`, `node_modules/`, `.next/`, cobertura, ZIPs anteriores, `tsconfig.tsbuildinfo` e `next-env.d.ts`. O professor poderá instalar as dependências com Node 24 e pnpm 11.19.0 e executar conforme o README; o banco local requer Docker em execução.

## Próxima tarefa sugerida

Completar e registrar as provas da aula 10, começando pela confirmação de carregamento e autenticação do MCP; depois concluir a integração e as provas da aula 11. Não criar tabelas ou autenticação apenas para preencher checklist de aula sem decisão de escopo.
