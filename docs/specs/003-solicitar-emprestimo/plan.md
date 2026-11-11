# Plano 003 — Catálogo e solicitação imediata

Derivado da [spec](spec.md), registrado antes da implementação em 11/11/2026
sob autorização local ampla do operador. Mantém ADR-001: monolito Next,
Client Components com TanStack/tRPC, Router → Service → Prisma, Zod estrito,
sessão SSR e banco PostgreSQL real. Não muda schema, migrations ou ADRs.

## Implementação

1. Calendário puro local e política: Intl com America/Sao_Paulo, datas civis
   iteradas sem mutar a entrada, feriados fixos e cálculo gregoriano da Páscoa
   para a Paixão de Cristo; cobertura 2026–2030 e falha explícita fora dela.
2. equipment.list e loans.mine com filtros obrigatórios do contexto, cursores
   pertencentes ao mesmo escopo e projeção mínima. Cadastro/retorno de imagens
   não exige novo campo persistido; UI usa o manifesto da skill.
3. loans.request em transação: bloqueio da Membership do ator e Equipment do
   tenant, consultas dentro da transação, política, atualização condicional
   da disponibilidade, criação de Loan e AuditEvent. Isolamento Serializable
   e repetição limitada de conflito serializável; falhas de domínio não são
   repetidas. O índice existente de item aberto continua como última defesa.
4. Interface /app e /app/meus-emprestimos conforme ADR-002 e skill visual,
   com procedures inferidas, paginação, invalidação e feedback. Não ampliar
   o ADR-003, cuja abrangência já aprovada é landing/login.
5. Testes unitários de calendário/política; integração com banco real para
   autorização, filtros, concorrência e rollback da auditoria; navegador para
   fluxo completo e estados. Root coordena Docker/build para evitar disputa
   por memória nesta máquina.

## Calendário e fonte

Fonte primária: [Ministério da Gestão — calendário federal 2026](https://www.gov.br/gestao/pt-br/assuntos/noticias/2025/dezembro/confira-o-calendario-oficial-de-feriados-nacionais-e-pontos-facultativos-em-2026),
consultada em 11/11/2026. Distingue feriados de pontos facultativos. Nove datas
fixas: 01/01, 21/04, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11 e 25/12;
Paixão de Cristo é calculada a partir da Páscoa. A aplicação das mesmas regras
em 2027–2030 é decisão conservadora documentada, não alegação de portarias
futuras já publicadas. Mudança legal requer revisão antes de ampliar cobertura.

## Compatibilidade e operação

- Rotas existentes e auth.me mantêm contratos; root adiciona equipment e loans.
- Nenhuma migration ou nova dependência. Bibliotecas instaladas são reutilizadas.
- Em erro de banco, responder genericamente, sem driver, credencial ou stack.
- Não há escrita remota nesta implementação. Fotos reais e conta do professor
  dependem do pacote de dados/imagens e da execução humana no deploy.
- Antes de declarar pronta: checks de rules/checks.md, navegador e verificador
  isolado com spec/plano/tarefas/código/testes e imagens efetivamente aprovadas.
