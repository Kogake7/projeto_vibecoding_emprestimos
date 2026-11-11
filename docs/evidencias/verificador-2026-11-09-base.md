Rodada `2026-11-09-base`. Conferência limitada às fontes fornecidas, sem executar ferramentas, checks ou alterações.

| CA | Evidência (arquivo:linha do teste) | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Nenhum teste fornecido cita CA-01. | SEM TESTE | O formulário cancela o envio em `src/components/login-screen.tsx:152`; o botão está desabilitado em `src/components/login-screen.tsx:195`. Não há autenticação nem redirecionamento demonstrados. |
| CA-02 | Nenhum teste fornecido cita CA-02. | SEM TESTE | Não há tratamento de credenciais inválidas. A mensagem em `src/components/login-screen.tsx:206` informa apenas que o acesso não está habilitado. |
| CA-03 | Nenhum teste fornecido cita CA-03. | SEM TESTE | `src/app/page.tsx:4` e `src/app/login/page.tsx:10` renderizam a tela; proteção de rota e redirecionamento não foram demonstrados no escopo. |
| CA-04 | Nenhum teste fornecido cita CA-04. | SEM TESTE | Renovação de sessão e proteção do token não têm implementação ou prova fornecida. O efeito em `src/components/login-screen.tsx:53` consulta somente `/api/health`. |
| CA-05 | Nenhum teste fornecido cita CA-05. | SEM TESTE | Resolução de membership, resposta `FORBIDDEN` e bloqueio de dados de domínio não estão demonstrados no escopo. |
| CA-06 | Nenhum teste fornecido cita CA-06. | SEM TESTE | Não foram fornecidos código ou testes de isolamento de leitura e mutação entre tenants. |
| CA-07 | Nenhum teste fornecido cita CA-07. | SEM TESTE | Não foi fornecida resolução de papel no servidor. A definição de membership ativa e sua ordenação também permanece pendente em `docs/specs/001-login/spec.md:52`. |
| CA-08 | `src/components/login-screen.test.tsx:7` | ATENDIDO | O teste executável cita o CA e verifica ações, links, aviso de convite e campos do formulário (`:9–26`). Resultado fornecido: passou. Consistente com os campos em `src/components/login-screen.tsx:163` e `:181`, botão em `:193` e aviso em `:219`; ambas as páginas renderizam esse componente. |

Checks e origem das evidências:

- `pnpm test src/components/login-screen.test.tsx`: executado pelo principal; exit `0`, um teste aprovado. Não executei pessoalmente.
- `pnpm db:generate`: sem resultado fornecido.
- `pnpm test` completo: sem resultado fornecido.
- `pnpm lint`: sem resultado fornecido.
- `pnpm typecheck`: sem resultado fornecido.
- `pnpm build`: sem resultado fornecido.
- Smoke tests, Preview/Vercel, CI e comparação com a versão anterior: sem evidência fornecida.
- Nenhum check foi executado nesta sessão, conforme a restrição expressa da delegação.

Fora de escopo: não identifiquei implementação dos fluxos excluídos pela spec nos arquivos fornecidos. O texto sobre equipamentos e empréstimos é apresentação, sem implementar esses fluxos. Sem diff ou fontes adicionais, não é possível conferir alterações no restante do repositório nem aprovar os comportamentos de servidor ausentes deste escopo.

Veredito: NÃO PRONTA

Somente CA-08 possui teste identificado, resultado aprovado e código consistente; CA-01 a CA-07 permanecem sem prova suficiente, coerentemente com as tarefas pendentes em `docs/specs/001-login/tasks.md:5`.