Rodada `20261111-versionada-restaurado`: análise somente das fontes fornecidas, sem executar ferramentas, checks ou alterações. Registros de aprovação anteriores não comprovam os CAs nesta rodada.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Não fornecida | SEM TESTE | O cliente chama a mutation e redireciona em `src/components/login-screen.tsx:74` e `src/components/login-screen.tsx:76`; faltam teste e implementação de servidor que comprovem credenciais válidas, Membership e sessão. |
| CA-02 | `src/components/login-screen.test.tsx:11` | SEM TESTE | O teste passou, mas verifica apenas `method="post"`. Não exercita credenciais inválidas, permanência no login nem mensagem genérica. O tratamento está em `src/components/login-screen.tsx:78` e a mensagem em `src/shared/login.ts:8`. |
| CA-03 | Não fornecida | SEM TESTE | Proteção de rota e redirecionamento sem sessão não estão demonstrados no escopo. |
| CA-04 | Não fornecida | SEM TESTE | Não foram fornecidos implementação nem teste de renovação e cookies sem exposição de token ao JavaScript. |
| CA-05 | Não fornecida | SEM TESTE | A apresentação de erro `FORBIDDEN` em `src/components/login-screen.tsx:85` não comprova bloqueio no servidor nem ausência de acesso a dados. |
| CA-06 | Não fornecida | SEM TESTE | Faltam implementação e teste de isolamento de leitura e mutação entre tenants. |
| CA-07 | Não fornecida | SEM TESTE | O schema limita o formulário a e-mail e senha em `src/shared/login.ts:3`; isso não comprova resolução de tenant e papel no servidor nem rejeição de falsificação pela API. |
| CA-08 | `src/components/login-screen.test.tsx:18` | ATENDIDO | Teste executado e aprovado verifica ausência de ações/links públicos de cadastro e convite, formulário único e somente e-mail/senha. Consistente com `src/components/login-screen.tsx:197`, `src/components/login-screen.tsx:271` e `src/components/login-screen.tsx:301`. |
| CA-09 | Não fornecida | SEM TESTE | Faltam implementação e teste de recusa de operação administrativa para colaborador, inclusive por chamada direta ou papel declarado. |
| CA-10 | Não fornecida | SEM TESTE | Faltam implementação e teste da permissão de ADMIN para ambos os níveis, limitada ao mesmo tenant. |
| CA-11 | Não fornecida | SEM TESTE | Faltam implementação e teste com múltiplos vínculos e papéis distintos, usando exclusivamente suporte_ti. |

Checks e origem dos resultados:

- `pnpm test src/components/login-screen.test.tsx`: **exit 0, dois testes aprovados**, conforme resultado fornecido pelo principal; não executado por mim.
- `pnpm db:generate`: resultado desta rodada não fornecido.
- `pnpm test` completo: resultado desta rodada não fornecido.
- `pnpm lint`: resultado desta rodada não fornecido.
- `pnpm typecheck`: resultado desta rodada não fornecido.
- `pnpm build`: resultado desta rodada não fornecido.
- Smoke tests, navegador, compatibilidade com a base, CI, Preview e Supabase real: não verificados nesta sessão; sem resultados executáveis fornecidos.

Fora de escopo: não identifiquei implementação dos itens excluídos em `docs/specs/001-login/spec.md:67` nos arquivos apresentados. O texto sobre equipamentos e empréstimos não implementa esses fluxos. Servidor, proxy, página protegida e banco ficaram fora do escopo recebido; sem essas fontes e seus testes, os CAs correspondentes não podem ser aprovados. Não foi fornecido diff para conferir alterações além dos arquivos apresentados.

Somente CA-08 possui teste pertinente, resultado aprovado e código consistente; os outros dez CAs carecem de prova suficiente nesta rodada.

Veredito: NÃO PRONTA