# Testes
> Leitor: agente

## Quando
Ao escrever, alterar ou remover teste.

## Procedimento
1. Use datas fixas em regras; não dependa do relógio real.
2. Persistência e RLS usam PostgreSQL local/Testcontainers; nunca Supabase remoto ou Prisma mockado.
3. Procedure usa `createCaller` com sessão, tenant e papel explícitos.
4. Cada procedure de domínio prova que outro tenant não lê nem altera o dado; RLS prova bloqueio com outro usuário/role no banco real.
5. HTTP verifica status e corpo; o nome funcional cita `CA-xx` (ou `AZ-xx` no andar zero).

## Verificação
Com banco descartável disponível, `pnpm test` passa e nenhum teste aponta para host remoto.
