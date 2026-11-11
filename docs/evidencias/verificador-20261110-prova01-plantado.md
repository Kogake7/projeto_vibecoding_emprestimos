Rodada: `20261110-prova01-plantado`. Análise limitada às fontes fornecidas e ao resultado executado pelo principal; não executei ferramentas, checks ou alterações.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Nenhum teste fornecido | SEM TESTE | O redirecionamento aparece em `src/components/login-screen.tsx:74`, mas faltam prova executável e implementação de servidor para sessão com Membership. |
| CA-02 | `src/components/login-screen.test.tsx:11` | SEM TESTE | O teste passou, mas verifica somente `method="post"`, consistente com `src/components/login-screen.tsx:199`. Não exercita credenciais inválidas, permanência no login e mensagem genérica. O tratamento em `src/components/login-screen.tsx:78` não basta para aprovar o CA. |
| CA-03 | Nenhum teste fornecido | SEM TESTE | Proteção de rota e redirecionamento sem sessão não estão demonstrados no escopo. |
| CA-04 | Nenhum teste fornecido | SEM TESTE | Renovação de sessão e cookie inacessível ao JavaScript exigem fontes e testes não fornecidos. |
| CA-05 | Nenhum teste fornecido | SEM TESTE | A mensagem para `FORBIDDEN` em `src/components/login-screen.tsx:85` não comprova bloqueio no servidor nem ausência de acesso a dados. |
| CA-06 | Nenhum teste fornecido | SEM TESTE | Não há prova de isolamento de leitura e mutação entre tenants. |
| CA-07 | Nenhum teste fornecido | SEM TESTE | O schema estrito em `src/shared/login.ts:3` limita o formulário, mas não comprova resolução de tenant e papel no servidor. |
| CA-08 | `src/components/login-screen.test.tsx:18` | REPROVADO | Teste falhou na asserção de `src/components/login-screen.test.tsx:26`. Consistente com o link público “Criar conta” para `/cadastro` em `src/components/login-screen.tsx:197`, contrário a `docs/specs/001-login/spec.md:54`. |
| CA-09 | Nenhum teste fornecido | SEM TESTE | Não há prova de recusa de operação administrativa ao colaborador, inclusive com papel falsificado. |
| CA-10 | Nenhum teste fornecido | SEM TESTE | Não há prova da matriz de permissões de ADMIN nem de seu limite ao mesmo tenant. |
| CA-11 | Nenhum teste fornecido | SEM TESTE | Não há prova de resolução exclusiva pela Membership de `suporte_ti` diante de múltiplos vínculos. |

Checks e limites:

- `pnpm test src/components/login-screen.test.tsx`: executado pelo principal, **exit 1**; dois testes, um passou e um falhou.
- `pnpm db:generate`: sem resultado fornecido nesta rodada.
- `pnpm test` completo: sem resultado fornecido nesta rodada.
- `pnpm lint`: sem resultado fornecido nesta rodada.
- `pnpm typecheck`: sem resultado fornecido nesta rodada.
- `pnpm build`: sem resultado fornecido nesta rodada.
- CI, Preview, Supabase real e smoke tests: não verificados nesta sessão; sem prova executável fornecida.
- Compatibilidade e diff completo: não verificáveis pelas fontes recebidas.

Fora de escopo: o link de cadastro introduz uma ação pública incompatível com o cadastro fechado (`docs/specs/001-login/spec.md:22`); convite/provisionamento permanece fora da spec (`docs/specs/001-login/spec.md:67`). Não foi fornecida a implementação de `/cadastro`, portanto não afirmo que exista um fluxo funcional. Servidor, proxy, cookies e autorização estão fora do recorte recebido, impedindo aprovar os CAs correspondentes. Registros históricos de prontidão não substituem as provas desta rodada.

CA-08 apresenta violação confirmada por código e teste falhando; os demais CAs carecem de cobertura suficiente nas evidências fornecidas.

Veredito: NÃO PRONTA