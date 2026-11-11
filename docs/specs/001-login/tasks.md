# Tarefas 001 — Login e autorização de acesso

Revisão de 09/11/2026 aprovada. T-04 concluída; o pedido posterior “Continue”
autorizou somente T-05, também concluída com validação local.
Depois, “pode fazer tudo” autorizou T-02/T-03 e as dependências apresentadas.
Ordem após T-01: T-04 → T-05 → T-02 → T-03.

- [x] T-01 — Criar a interface responsiva de `/login`, sem autoinscrição e
      sem simular uma sessão. Referência: CA-08.
- [x] T-02 — Implementar e testar o envio seguro de credenciais e a mensagem
      genérica de falha. Referências: CA-01 e CA-02.
- [x] T-03 — Implementar e testar renovação de sessão e proteção de rotas.
      Referências: CA-03 e CA-04.
- [x] T-04 — Criar o serviço de resolução de acesso em suporte_ti, exigindo
      identidade validada e vínculo existente; testar papéis diferentes entre
      tenants em PostgreSQL local real, sem schema novo. Referências: CA-05,
      CA-06, CA-07 e CA-11. Implementada e validada localmente com Node 24 e
      pnpm 11.19.0, conforme o ambiente adotado.
- [x] T-05 — Integrar leitura segura da identidade e contexto por request aos
      middlewares tRPC; provar que COLLABORATOR não administra e ADMIN também pode
      usar funções de colaborador, sem aceitar tenant/role do cliente.
      Referências: CA-05, CA-06, CA-07, CA-09, CA-10 e CA-11.

Marcar uma tarefa não aprova a spec inteira: a conferência independente
precisa avaliar os onze CAs. Convites, população da conta do professor e
implementação de catálogo/Operações continuam fora desta spec.

Registro T-04 em 09/11/2026: serviço e 11 testes em PostgreSQL real implementados,
sem schema novo ou alteração de dependências da aplicação. Após autorização
específica, pnpm 11.19.0 foi preparado temporariamente e todos os checks locais
passaram, incluindo a suíte completa de 22 testes. Ver [evidências](../../evidencias/login-t04-2026-11-09.md).
CI remoto e Preview não foram executados. Ao encerrar T-04, T-05/T-02/T-03
ainda não tinham sido iniciadas.

Registro T-05 em 09/11/2026: cliente SSR de servidor, contexto por request,
middlewares de identidade/tenant/ADMIN e consulta `auth.me` implementados.
Checks locais passaram com Node 24 e pnpm 11.19.0, incluindo 47 testes e smoke
HTTP do build Next. Nenhuma dependência ou migration nova. Ver
[evidências](../../evidencias/login-t05-2026-11-09.md). Provedor real, CI remoto e
Preview não validados; formulário e renovação/proteção de páginas ainda pendentes
em T-02/T-03. A spec inteira permanece NÃO PRONTA.

Registro posterior T-02/T-03 em 09/11/2026: formulário, mutation de login,
sessão em cookie httpOnly, proxy de renovação e página /app implementados.
Geração Prisma, 54 testes, lint, tipos e build passaram com Node 24/pnpm 11.19.0;
formulário e ambos os perfis conferidos no navegador local. Ver
[evidências](../../evidencias/login-t02-t03-2026-11-09.md). Esta marcação é local;
CI remoto, Preview e provedor real não foram validados.

Fechamento: 55 testes Vitest e quatro testes adicionais no navegador passaram,
incluindo regressão do POST nativo sem credenciais na URL. A rodada
[login-final-20261109-03](../../evidencias/verificador-login-final-20261109-03.md)
retornou **PRONTA**, com onze CAs atendidos, teste direcionado exit 0 (45 casos),
CLI exit 0 e fontes preservadas. Spec concluída com provas locais; pendências
de validação remota não autorizam publicação nem são declaradas concluídas.
