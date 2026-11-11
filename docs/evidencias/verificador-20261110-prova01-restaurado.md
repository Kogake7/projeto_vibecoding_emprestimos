Rodada `20261110-prova01-restaurado`: conferência limitada às fontes e ao resultado fornecidos, sem reutilizar aprovações históricas.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Não fornecida | SEM TESTE | Há chamada de login e redirecionamento em `src/components/login-screen.tsx:74`, mas falta prova executável de credenciais válidas, Membership e sessão. |
| CA-02 | `src/components/login-screen.test.tsx:11` | SEM TESTE | O teste passou, mas verifica somente `method="post"`. Não exercita credenciais inválidas, permanência no login ou mensagem genérica. O tratamento existe em `src/components/login-screen.tsx:78` e a mensagem em `src/shared/login.ts:8`. |
| CA-03 | Não fornecida | SEM TESTE | Proteção de rota e redirecionamento sem sessão não estão demonstrados no escopo recebido. |
| CA-04 | Não fornecida | SEM TESTE | Renovação e cookie inacessível ao JavaScript dependem de implementação e testes não fornecidos. |
| CA-05 | Não fornecida | SEM TESTE | Falta prova de `FORBIDDEN` e bloqueio de dados sem Membership em suporte_ti. Exibir uma mensagem para `FORBIDDEN` em `src/components/login-screen.tsx:85` não comprova autorização. |
| CA-06 | Não fornecida | SEM TESTE | Não há teste nem implementação de isolamento entre tenants nas fontes recebidas. |
| CA-07 | Não fornecida | SEM TESTE | O schema limita os campos em `src/shared/login.ts:3`, mas não demonstra resolução de tenant e papel no servidor. |
| CA-08 | `src/components/login-screen.test.tsx:18` | ATENDIDO | Teste executado e aprovado verifica ausência de ações/links de cadastro e convite, formulário único e campos de credenciais. Consistente com `src/components/login-screen.tsx:197` e `src/components/login-screen.tsx:301`; ambas as páginas reutilizam a tela em `src/app/page.tsx:4` e `src/app/login/page.tsx:10`. |
| CA-09 | Não fornecida | SEM TESTE | Falta teste de operação administrativa negada ao colaborador, inclusive acesso direto e falsificação de papel. |
| CA-10 | Não fornecida | SEM TESTE | Falta teste das permissões de ADMIN e do limite ao mesmo tenant. |
| CA-11 | Não fornecida | SEM TESTE | Falta teste com múltiplas Memberships e papéis diferentes entre áreas. |

Checks:

- `pnpm test src/components/login-screen.test.tsx`: executado pelo principal; exit 0, dois testes aprovados.
- `pnpm db:generate`: resultado desta rodada não fornecido.
- `pnpm test` completo: resultado desta rodada não fornecido.
- `pnpm lint`: resultado desta rodada não fornecido.
- `pnpm typecheck`: resultado desta rodada não fornecido.
- `pnpm build`: resultado desta rodada não fornecido.
- Smoke funcional, compatibilidade, CI, Preview e Supabase real: sem evidência nesta rodada.
- Nesta sessão não executei checks, ferramentas ou alterações, conforme solicitado.

Fora de escopo: não identifiquei implementação de funcionalidades excluídas pela spec nos arquivos fornecidos. Sem diff/base e sem fontes do servidor, a conferência de ampliação de escopo permanece limitada. Os registros históricos de prontidão não substituem as provas exigidas nesta rodada (`agents/verificador-spec.md:38` e `agents/verificador-spec.md:50`).

Dez CAs permanecem sem prova executável suficiente para aprovação.

Veredito: NÃO PRONTA