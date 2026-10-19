# Testes

> Leitor: agente

## Quando

Ao escrever, alterar ou remover teste.

## Procedimento

1. Testes de regra usam datas fixas e não dependem do relógio real.
2. Testes de persistência e RLS usam PostgreSQL local/Testcontainers, nunca Supabase remoto e nunca Prisma mockado.
3. Testes de procedure usam `createCaller` com sessão, tenant e papel explícitos.
4. Cada procedure de domínio prova que outro tenant não lê nem altera o dado.
5. Teste HTTP verifica status e corpo; teste funcional referencia o critério que comprova.

## Verificação

Com banco de teste descartável disponível, `pnpm test` passa e nenhum teste aponta para host remoto.
