Rodada: `2026-11-09-plantado`. Conferência somente das fontes fornecidas; nenhum comando executado ou arquivo alterado nesta sessão.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Não fornecida | SEM TESTE | Sem teste que cite o CA. Envio apenas chama `preventDefault` em `src/components/login-screen.tsx:153`; botão desabilitado em `src/components/login-screen.tsx:196`. Não há comprovação de sessão ou redirecionamento. |
| CA-02 | Não fornecida | SEM TESTE | Sem teste que cite o CA. Não há tratamento de credenciais inválidas no formulário; a mensagem em `src/components/login-screen.tsx:207` informa acesso não habilitado. |
| CA-03 | Não fornecida | SEM TESTE | Rotas protegidas e redirecionamento sem sessão não foram fornecidos. `src/app/page.tsx:4` e `src/app/login/page.tsx:10` apenas renderizam a tela. |
| CA-04 | Não fornecida | SEM TESTE | Renovação de sessão e configuração de cookies não constam do escopo fornecido. Sem prova de indisponibilidade do token ao JavaScript. |
| CA-05 | Não fornecida | SEM TESTE | Autorização por membership e resposta `FORBIDDEN` não constam do escopo fornecido. |
| CA-06 | Não fornecida | SEM TESTE | Consultas, mutações e testes de isolamento entre tenants não foram fornecidos. |
| CA-07 | Não fornecida | SEM TESTE | Resolução de papel no servidor não foi fornecida. A definição de membership ativa e sua ordenação permanece pendente em `docs/specs/001-login/spec.md:53`. |
| CA-08 | `src/components/login-screen.test.tsx:7` | REPROVADO | Teste executável cita o CA e falhou na asserção de `src/components/login-screen.test.tsx:13`. Resultado consistente com o link público “Criar conta” para `/cadastro` em `src/components/login-screen.tsx:150`, contrário a `docs/specs/001-login/spec.md:30`. |

Checks e origem da evidência:

- `pnpm test src/components/login-screen.test.tsx`: executado pelo principal; **EXIT 1**, um teste, uma falha.
- `pnpm db:generate`: sem resultado fornecido.
- `pnpm test` completo: sem resultado fornecido.
- `pnpm lint`: sem resultado fornecido.
- `pnpm typecheck`: sem resultado fornecido.
- `pnpm build`: sem resultado fornecido.
- Smoke tests, compatibilidade com a base, revisão completa do diff, Preview/Vercel e CI: sem evidência fornecida; não realizados nesta sessão.

Fora de escopo: a tela oferece entrada pública para cadastro em `src/components/login-screen.tsx:150`, contrariando o cadastro fechado (`docs/specs/001-login/spec.md:13`). A implementação do destino `/cadastro` não foi fornecida; não é possível afirmar que exista. A conferência não cobre arquivos além dos recebidos.

O CA-08 está reprovado e CA-01 a CA-07 não possuem testes e evidências suficientes para aprovação.

Veredito: NÃO PRONTA