Rodada `2026-11-09-restaurado`. Conferência restrita às fontes fornecidas; nenhum comando executado ou arquivo alterado nesta sessão.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Ausente | SEM TESTE | Não há teste que cite o CA. O formulário impede o envio em `src/components/login-screen.tsx:152`, e o botão está desabilitado em `src/components/login-screen.tsx:195`; não comprova autenticação nem redirecionamento. |
| CA-02 | Ausente | SEM TESTE | Não há teste que cite o CA nem tratamento de credenciais inválidas. A mensagem em `src/components/login-screen.tsx:206` informa apenas que o acesso não está habilitado. |
| CA-03 | Ausente | SEM TESTE | Proteção de rota não foi fornecida. As páginas apenas renderizam a tela: `src/app/page.tsx:4` e `src/app/login/page.tsx:10`. |
| CA-04 | Ausente | SEM TESTE | Renovação de sessão e proteção do token não têm implementação ou teste demonstrados no escopo. |
| CA-05 | Ausente | SEM TESTE | Resolução de membership, resposta `FORBIDDEN` e bloqueio de dados de domínio estão fora das fontes de implementação fornecidas. |
| CA-06 | Ausente | SEM TESTE | Não foram fornecidos código de isolamento nem teste que cite o CA e comprove leitura e mutação entre tenants. |
| CA-07 | Ausente | SEM TESTE | Não foram fornecidos resolução de papel no servidor nem teste que cite o CA. |
| CA-08 | `src/components/login-screen.test.tsx:7` | ATENDIDO | Teste executável cita o CA e passou segundo o principal. Verifica ações, links, aviso de convite e campos do formulário (`src/components/login-screen.test.tsx:9`). Consistente com o formulário em `src/components/login-screen.tsx:150` e o aviso em `src/components/login-screen.tsx:219`. Ambas as páginas usam esse componente. |

A definição de membership “ativa” e sua ordenação continuam explicitamente pendentes em `docs/specs/001-login/spec.md:53`, afetando a validação futura dos critérios de membership.

Checks e origem dos resultados:

- `pnpm test src/components/login-screen.test.tsx`: principal informou **EXIT 0**, com **1 teste aprovado**; consistente com o único teste fornecido.
- `pnpm db:generate`: sem resultado fornecido.
- `pnpm test` completo: sem resultado fornecido.
- `pnpm lint`: sem resultado fornecido.
- `pnpm typecheck`: sem resultado fornecido.
- `pnpm build`: sem resultado fornecido.
- Smoke tests, compatibilidade com a base, Preview/Vercel e CI: sem evidência fornecida.

Os checks acima não foram executados nesta sessão por determinação explícita da delegação.

Fora de escopo: não identifiquei fluxo implementado de cadastro, convite, recuperação de senha ou demais funcionalidades excluídas em `docs/specs/001-login/spec.md:34`. Os textos sobre equipamentos e empréstimos são apresentação. Sem diff ou fontes adicionais, não é possível conferir alterações fora dos arquivos fornecidos.

Somente CA-08 tem teste identificado, resultado aprovado e implementação consistente; CA-01 a CA-07 permanecem sem comprovação, coerentemente com as tarefas abertas em `docs/specs/001-login/tasks.md:5`.

Veredito: NÃO PRONTA