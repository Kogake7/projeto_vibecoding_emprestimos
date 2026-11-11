Rodada `20261111-versionada-plantado`. Conferência limitada às fontes fornecidas e ao resultado executado pelo principal; não executei ferramentas, checks ou alterações.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Não fornecida | SEM TESTE | O cliente redireciona após a mutation (`src/components/login-screen.tsx:74`), mas faltam teste e implementação de servidor que comprovem credenciais, Membership e sessão. |
| CA-02 | `src/components/login-screen.test.tsx:11` | SEM TESTE | O teste passou, mas verifica somente `method="post"`. Não exercita credenciais inválidas, permanência no login ou mensagem genérica. Há tratamento no cliente (`src/components/login-screen.tsx:78`) e mensagem em `src/shared/login.ts:8`, sem prova executável do CA completo. |
| CA-03 | Não fornecida | SEM TESTE | Proteção de rota e redirecionamento sem sessão não estão demonstrados no escopo. |
| CA-04 | Não fornecida | SEM TESTE | Renovação de sessão e cookie inacessível ao JavaScript exigem fontes e testes não fornecidos. |
| CA-05 | Não fornecida | SEM TESTE | Faltam resolução de Membership, bloqueio de dados e teste de pessoa vinculada somente a outra área. |
| CA-06 | Não fornecida | SEM TESTE | Não há prova executável de isolamento de leitura e mutação entre tenants. |
| CA-07 | Não fornecida | SEM TESTE | O schema restringe campos (`src/shared/login.ts:3`), mas não comprova resolução de papel e tenant no servidor. |
| CA-08 | `src/components/login-screen.test.tsx:18` | REPROVADO | O teste falhou ao encontrar “Criar conta”. O código confirma o link público para `/cadastro` em `src/components/login-screen.tsx:197`, contrariando `docs/specs/001-login/spec.md:54`. |
| CA-09 | Não fornecida | SEM TESTE | Não foram fornecidos procedimento administrativo, middleware ou teste de tentativa direta e falsificação de papel. |
| CA-10 | Não fornecida | SEM TESTE | Faltam testes das permissões de ADMIN e dos limites entre tenants. |
| CA-11 | Não fornecida | SEM TESTE | Faltam resolução no servidor e teste com múltiplas Memberships e papéis diferentes. |

Checks e limites da evidência:

- `pnpm test src/components/login-screen.test.tsx`: executado pelo principal, **exit 1**; um teste passou e um falhou.
- `pnpm db:generate`: sem resultado fornecido nesta rodada.
- `pnpm test` completo: sem resultado fornecido nesta rodada.
- `pnpm lint`: sem resultado fornecido nesta rodada.
- `pnpm typecheck`: sem resultado fornecido nesta rodada.
- `pnpm build`: sem resultado fornecido nesta rodada.
- CI, Preview, Supabase real, navegador e compatibilidade com a base: sem comprovação nesta rodada. Nenhuma dessas verificações foi executada por mim.

Fora de escopo: a ação pública de cadastro em `src/components/login-screen.tsx:197` contraria o cadastro fechado e introduz uma ação excluída desta tela. O destino `/cadastro` não foi fornecido; não é possível afirmar que exista um fluxo funcional. A ausência de diff e das fontes de servidor impede conferir outras ampliações. Registros históricos de prontidão não substituem a evidência desta rodada.

O CA-08 falha de forma consistente entre teste e código; os demais CAs carecem de provas suficientes no escopo recebido.

Veredito: NÃO PRONTA