# Tarefas 003 — Catálogo e solicitação imediata

Spec e plano registrados antes do código em 11/11/2026. Execução local ampla
autorizada, sem aprovações intermediárias individuais; commits pelo principal.

- [x] T-01 — Calendário e política de 14 dias úteis com testes de fronteiras,
      feriados e hora local. CA-03, CA-04.
- [ ] T-02 — Procedures de catálogo e empréstimos próprios, paginação e
      isolamento com PostgreSQL real. CA-01, CA-07, CA-08, CA-11.
- [ ] T-03 — Solicitação transacional, concorrência, disponibilidade e
      auditoria com rollback. CA-02, CA-03, CA-05, CA-06, CA-07.
- [ ] T-04 — Interface do catálogo, navegação e fotos/créditos com estados
      completos. CA-01, CA-09, CA-10, CA-11.
- [ ] T-05 — Interface dos empréstimos próprios e integração de sucesso,
      erro e invalidação. CA-08, CA-09, CA-11.
- [ ] T-06 — Checks completos, navegador e conferência independente isolada
      de todos os CAs. Fotos pendentes não podem ser marcadas atendidas.

Cada tarefa só recebe marca de conclusão após suas validações. Entrega local
não substitui CI, Preview, provisão real ou upload pelo operador.

Registro local de 11/11/2026: T-01 passou nos 18 testes puros de calendário e
política (Vitest exit 0). T-02/T-03 estão implementadas, com 15 casos de
integração preparados, aguardando a execução PostgreSQL coordenada pelo
principal. T-04/T-05 foram implementadas pelo agente de interface, com oito
testes SSR e lint locais aprovados; integração/navegador e fotos reais ainda
dependem da rodada completa. T-06 e a prontidão integral não foram declaradas.
