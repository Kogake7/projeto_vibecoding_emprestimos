# Checks antes de concluir uma tarefa

> Leitor: agente

Este arquivo complementa o `AGENTS.md` e `rules/restrictions.md`. Use-o como definição de pronto para qualquer alteração no projeto.

Antes de afirmar que uma tarefa **terminou**, **está pronta** ou **não quebrou nada**, execute as verificações aplicáveis abaixo e registre os resultados. Implementar o código não é o mesmo que validar a entrega.

## Regra de conclusão

- Não declarar conclusão com checks obrigatórios falhando ou não executados.
- Se um check não puder ser executado por falta de acesso, ambiente, credencial ou serviço, informar: **implementado, mas não totalmente validado**.
- Não substituir teste por suposição, leitura de código ou frase como "deve funcionar".
- Não ocultar falhas preexistentes. Diferenciá-las de regressões causadas pela mudança e registrar ambas.
- Corrigir apenas regressões pertencentes à tarefa autorizada; demais falhas devem ser relatadas separadamente.

## Checklist mínimo para mudanças de código

Execute a partir da raiz do repositório:

```bash
pnpm db:generate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Confirme que:

- todos os comandos terminaram com código de saída zero;
- não surgiram warnings relevantes de build, segurança ou dependências;
- o build usou a mesma versão principal de Node.js e a mesma versão de pnpm adotadas no projeto e no CI;
- arquivos gerados ou artefatos temporários não foram incluídos por engano;
- nenhuma credencial ou variável secreta foi adicionada ao diff, ao bundle do cliente ou aos logs.

Mudanças exclusivamente documentais podem dispensar a suíte completa. Nesse caso, valide links, caminhos, comandos citados, coerência com os arquivos-fonte e formatação do Markdown.

## Compatibilidade com a versão anterior

Compare a mudança com a versão atualmente implantada ou com a base do branch. Verifique, conforme o caso:

- URLs, rotas e fluxos existentes continuam acessíveis;
- inputs e outputs de procedures tRPC continuam compatíveis com as telas existentes;
- campos obrigatórios novos possuem valor padrão, backfill ou rollout em etapas;
- alterações de enum tratam valores já armazenados;
- variáveis de ambiente existentes continuam aceitas e novas variáveis estão documentadas e configuradas antes do deploy;
- cookies, sessão e middleware continuam compatíveis com usuários autenticados antes da mudança;
- cache, paginação e serialização preservam dados antigos;
- seed continua idempotente e não duplica nem apaga dados;
- clientes ou telas antigas não quebram durante a janela entre migration e deploy.

Quando houver risco de incompatibilidade, prefira uma mudança aditiva e um rollout em etapas. Não remova contrato, coluna ou comportamento ainda usado pela versão implantada.

## Migrations e banco de dados

Para qualquer mudança no banco, siga a validação e o fluxo definidos em `rules/migration.md`.

## Regressão funcional

Execute testes automatizados e smoke tests dos fluxos afetados. Quando a mudança tocar funcionalidades centrais, verifique no mínimo:

- login e renovação de sessão;
- catálogo e status de disponibilidade;
- solicitação de empréstimo;
- limite de 3 empréstimos abertos;
- bloqueio de usuário com item atrasado;
- bloqueio de item emprestado ou em manutenção;
- devolução de equipamento;
- tela administrativa com empréstimos em aberto;
- gravação do evento de auditoria;
- comportamento de loading, vazio e erro na interface.

Correções de bug precisam de teste de regressão que falhe antes da correção e passe depois.

## Segurança e multi-tenancy

Para toda procedure ou consulta alterada:

- testar usuário não autenticado;
- testar colaborador sem permissão administrativa;
- testar administrador quando aplicável;
- provar que tenant A não lê nem altera dados do tenant B;
- verificar que `tenant_id` vem da sessão/contexto, nunca do input;
- verificar que os filtros de tenant não podem ser omitidos pelo service;
- confirmar que dados sensíveis e segredos não aparecem no cliente, erros ou logs;
- conferir que mutações relacionadas usam transação quando atomicidade for necessária.

## Verificação na Vercel

Para mudanças que afetam aplicação, runtime, dependências, banco, variáveis de ambiente, rotas ou build:

1. Localizar o Preview Deployment associado ao branch ou pull request. Criar
   um novo preview somente com autorização explícita para esse deploy.
2. Confirmar que o build da Vercel terminou com sucesso e revisar warnings e logs.
3. Confirmar que as variáveis de ambiente exigidas existem no ambiente de Preview sem expor seus valores.
4. Abrir a URL de preview e executar smoke tests dos fluxos afetados.
5. Verificar rotas de API/tRPC, autenticação, assets, navegação e persistência.
6. Verificar logs de runtime após os testes e confirmar ausência de exceções novas.
7. Quando houver migration, usar somente o ambiente de preview/teste autorizado; nunca testar uma migration destrutiva no banco de produção.

Não fazer deploy em produção apenas para validar uma tarefa. Preview e
publicação em produção exigem autorização explícita para o ambiente e o
destino. Se não houver autorização, acesso à Vercel ou Preview Deployment
disponível, registrar a validação como pendente e não afirmar que a entrega foi
validada em ambiente implantado.

## CI e integração

Quando houver branch ou pull request:

- confirmar que o GitHub Actions executou instalação com lockfile, geração do Prisma, testes, lint, typecheck e build;
- aguardar todos os checks obrigatórios terminarem;
- revisar a causa de jobs ignorados, cancelados ou instáveis;
- não considerar verde um pipeline com etapa relevante desativada ou marcada para ignorar falha.

Os checks locais complementam o CI; um não substitui o outro quando ambos estão disponíveis.

## Revisão final do diff

Antes do feedback final:

- revisar todos os arquivos alterados e confirmar que pertencem à tarefa;
- verificar se nomes, imports, tipos, mensagens de erro e comentários continuam coerentes;
- procurar código temporário, logs de depuração, TODOs acidentais e desativações de regras;
- confirmar que documentação e `.env.example` acompanham novos requisitos;
- confirmar que ADR existente só foi modificado com autorização explícita;
- comparar termos de produto alterados com `docs/PRD.md` e remover vocabulário
  copiado de outros domínios;
- confirmar que não houve ampliação de escopo.

## Evidência no feedback

O feedback de conclusão deve informar:

- comandos executados e resultado de cada um;
- testes funcionais realizados e ambiente utilizado;
- resultado do Preview Deployment da Vercel, quando aplicável;
- compatibilidade verificada com a versão anterior;
- checks não executados e motivo;
- riscos residuais ou pendências.

Use afirmações precisas. Exemplos:

- `Validado localmente: testes, lint, typecheck e build passaram.`
- `Validado no Preview Deployment da Vercel: login e empréstimo passaram no smoke test.`
- `Implementado, mas a validação na Vercel está pendente por falta de acesso ao projeto.`

Não use `tudo funcionando`, `sem regressões` ou equivalente sem evidência compatível com a amplitude da afirmação.
