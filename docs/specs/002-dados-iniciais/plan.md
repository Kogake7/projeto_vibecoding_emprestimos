# Plano 002 — Dados iniciais

Derivado da spec em 11/11/2026, antes do código, sob a autorização de execução
local completa. Fontes: ADR-001 (Prisma, monolito, seed idempotente e tenant),
rules/migration.md, rules/secrets.md e rules/checks.md.

1. Manter a lista do enunciado como JSON tipado/validado pelo serviço.
2. Aplicar inventário em transação serializável: upsert do tenant, lock da
   linha do tenant, validação de conflitos e criação somente dos ausentes.
3. Compartilhar uma guarda de CLI que exige --apply e --confirm-target com
   a referência exata do projeto Supabase (ou hostname de loopback local).
   Validar a referência na URL antes de conectar; nunca imprimir credenciais.
4. Evoluir prisma/seed.ts para chamar o serviço somente após a guarda.
5. Preparar comando humano para verificar a identidade no auth.users por
   UUID e e-mail fixo antes de criar Membership ADMIN; exigir zero empréstimos.
6. Testar criação, reexecução, estados preservados, rollback, isolamento,
   vínculo e recusa de execução sem confirmação. Não usar Supabase remoto.
7. Executar checks e o verificador isolado sobre spec/plano/tarefas, fontes
   e resultados locais. Provisionamento remoto fica documentado como pendente.

Sem migration, nova dependência, nova variável de ambiente, redefinição de
senha ou modificação de ADR. O manifesto da skill é o contrato de imagens.
