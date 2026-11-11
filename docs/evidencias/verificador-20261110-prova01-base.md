Rodada `20261110-prova01-base`: análise somente das fontes fornecidas, sem executar checks, usar ferramentas ou editar arquivos. O resultado dos testes foi fornecido pelo principal; registros históricos não comprovam esta rodada.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Nenhum teste fornecido cita CA-01. | SEM TESTE | Há chamada de login e redirecionamento em `src/components/login-screen.tsx:74` e `src/components/login-screen.tsx:76`, mas faltam prova de credenciais válidas, Membership e criação da sessão. |
| CA-02 | `src/components/login-screen.test.tsx:11` | SEM TESTE | O teste passou, mas verifica somente `method="post"`. Não exercita credenciais inválidas, permanência no login ou mensagem genérica. O tratamento existe em `src/components/login-screen.tsx:78` e a mensagem em `src/shared/login.ts:8`, sem comprovação executável do CA. |
| CA-03 | Nenhum teste fornecido cita CA-03. | SEM TESTE | Proteção de rota e redirecionamento sem sessão não estão demonstrados pelo escopo fornecido. |
| CA-04 | Nenhum teste fornecido cita CA-04. | SEM TESTE | Renovação de sessão e proteção do token por cookie httpOnly exigem fontes e testes ausentes. |
| CA-05 | Nenhum teste fornecido cita CA-05. | SEM TESTE | A mensagem para `FORBIDDEN` em `src/components/login-screen.tsx:85` não comprova bloqueio no servidor nem ausência de acesso a dados. |
| CA-06 | Nenhum teste fornecido cita CA-06. | SEM TESTE | Não há prova de isolamento de leitura e mutação entre tenants. |
| CA-07 | Nenhum teste fornecido cita CA-07. | SEM TESTE | O schema estrito em `src/shared/login.ts:3` limita credenciais, mas não comprova resolução de tenant e papel no servidor. |
| CA-08 | `src/components/login-screen.test.tsx:18` | ATENDIDO | Teste passou e verifica ações, links, formulário único e campos de credenciais. Consistente com a tela em `src/components/login-screen.tsx:197` e `src/components/login-screen.tsx:300`, compartilhada pelas páginas em `src/app/page.tsx:4` e `src/app/login/page.tsx:10`. |
| CA-09 | Nenhum teste fornecido cita CA-09. | SEM TESTE | Faltam implementação e prova da autorização administrativa na API. |
| CA-10 | Nenhum teste fornecido cita CA-10. | SEM TESTE | Faltam provas da matriz de permissões de ADMIN e do isolamento entre tenants. |
| CA-11 | Nenhum teste fornecido cita CA-11. | SEM TESTE | Faltam resolução de Membership e teste com vínculos em várias áreas. |

Checks:

- `pnpm test src/components/login-screen.test.tsx`: principal informou **exit 0**, dois testes passaram; cobertura suficiente somente para CA-08.
- `pnpm db:generate`: não executado nesta sessão; resultado desta rodada não fornecido.
- `pnpm test` completo: não executado nesta sessão; resultado desta rodada não fornecido.
- `pnpm lint`: não executado nesta sessão; resultado desta rodada não fornecido.
- `pnpm typecheck`: não executado nesta sessão; resultado desta rodada não fornecido.
- `pnpm build`: não executado nesta sessão; resultado desta rodada não fornecido.
- CI, Preview, navegador e Supabase real: não verificados; sem evidência executável fornecida nesta rodada.

Fora de escopo: não identifiquei implementação de funcionalidades excluídas pela spec nos arquivos apresentados. A conferência fica limitada a esses arquivos: servidor de autenticação/autorização, proxy, cookies, rota protegida e banco não foram fornecidos. Não é possível confirmar ausência de ampliação de escopo no restante do repositório.

Veredito: NÃO PRONTA

Somente CA-08 possui teste executado e consistente que comprova integralmente o critério; os outros dez CAs carecem de prova suficiente nesta rodada.