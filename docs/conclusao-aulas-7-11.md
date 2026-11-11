# Aulas 7 a 11 — requisitos e evidências

Revisão iniciada em 06/11/2026 a partir dos HTMLs locais, excluindo
`aulas/pratica-sdd-subagentes.html`. Este documento distingue artefato existente,
prova executada, adaptação autorizada e requisito sem comprovação.
Não é uma declaração de que todas as aulas estão concluídas.

## Estado na pausa solicitada pelo operador

O operador pediu para parar em 06/11/2026. Retomar pelo `handoff.md` da raiz.

- Host: geração Prisma, 11 testes, primeira execução de lint, typecheck e build
  passaram. O primeiro build no sandbox falhou por EPERM; repetição fora dele
  passou. A segunda execução de lint foi interrompida na pausa; a validação
  final após todas as edições ainda precisa ser fechada.
- CA-08 foi comentado temporariamente; sessão limpa marcou `SEM TESTE`, viu
  falha da suíte (0 testes no arquivo) e recusou corrigir como verificador.
  Principal restaurou o arquivo: SHA-256
  `CC53A70CD244849EB15F8200AEE760CB135DBEC83194D4461EDA00253CD9E71A`
  igual antes/depois. Suíte após restauração passou com 11 testes.
- Sessão limpa de prontidão acionou o verificador sem nomeá-lo no pedido;
  CA-08 `ATENDIDO`, CA-01 a CA-07 `SEM TESTE`, veredito `NÃO PRONTA`.
- OAuth do MCP restrito concluído pelo operador; cinco ferramentas reais
  confirmadas. Consulta escalar com aprovação também falhou por timeout:
  `evidencias/aula10-mcp-consulta.md`. Não repetir cegamente nem declarar prova
  de leitura de banco concluída.
- Docker Desktop iniciado. Projeto Compose isolado `aulas711_20261106`, volume
  `aulas711_20261106_equipamentos_postgres`, criado vazio (0 tabelas públicas).
  Duas migrations existentes aplicadas com sucesso apenas em `127.0.0.1:5432`;
  os dois seeds terminaram com exit 0. Estado final/idempotência ainda sem consulta.
- Build da imagem da aplicação falhou em timeout de download do pnpm/NPM;
  AZ-01 ainda não está provado. Nenhuma dependência foi atualizada.
- `prisma/tests/andar-zero.sql` foi criado, mas NÃO executado nem validado.
  É teste local transacional de fixtures, constraints, RLS e auditoria; não é migration.
- Servidor local do build em porta 3100 iniciou; foi encerrado na pausa, sem
  smoke de HTTP ou navegador. O helper visual expirou; nenhuma imagem foi validada.
- Container do banco local parado com sucesso; volume preservado para retomada.
- Histórico: seis commits inspecionados, sem ocorrências dos padrões de token
  pesquisados; apenas `.env.example` encontrado no histórico de nomes `.env*`.
  Isso é varredura limitada, não certificação de ausência de todo segredo possível.
- Nenhum commit, push, tag, deploy, mudança de ADR ou alteração remota foi feito.

## Aula 7 — especificação antes da implementação

- PRD: `PRD.md`; stack com justificativas e alternativas: `adr/001-stacks.md`.
- Cinco perguntas com tipo e “por que importa”: `specs/001-login/spec.md`.
  As respostas existentes foram preservadas; não se inventou aprovação histórica.
- Spec, plano e tarefas separados por feature: `specs/001-login/`.
- Intenção governa implementação: `rules/spec-flow.md` exige spec e plano
  aprovados, atualização da spec antes do comportamento e referência de CA.
- Decisão pendente antes de T-04: atividade e ordenação de memberships.

## Aula 8 — andar zero

- Critérios AZ-01 a AZ-08: `andar-zero.md`; plano: `plan-andar-zero.md`.
- Aplicação, banco, migrations e seed: `compose.yaml`, `Dockerfile`, `prisma/`.
- Health técnico com sucesso/falha e consumo no rodapé da interface existente.
- Ambiente: Node 24; projeto, Dockerfile e CI fixam pnpm 11.19.0.
- Histórico real: commits `5cf6737`, `9b6a4a1`, `2cc0afa`, `edacaa5`,
  `a3f6e0b` e `bb98485`; não reproduz um commit por tarefa do andar zero.
  Não reescrever o histórico para simular a ordem da aula.
- A tag `andar-zero` não foi encontrada na inspeção inicial. Não criar uma tag
  retroativa de conclusão sem prova do estado que ela identificaria.
- Auditoria do histórico e execução em banco vazio: resultados a registrar.

## Aula 9 — autoridade e procedimentos

- Oito arquivos em `rules/`, com leitores, comandos e limites aplicáveis ao Prisma.
- `migration.md`: proposta de DDL com RLS, compatibilidade e alvo deve ser
  apresentada antes de editar schema ou gerar migration; parar para aprovação.
- `tests.md`: nome do teste funcional cita CA; testes técnicos usam AZ;
  persistência/RLS em PostgreSQL local real, sem Prisma mockado.
- Adaptação autorizada pelo operador em 06/11/2026: manter login reutilizando
  schema, sem criar coluna ou tabela apenas para cumprir exercício.
- Prova em sessão limpa `provas_regras`: listou as oito rules e recusou
  alteração direta pelo MCP e publicação sem ambiente/destino exatos, citando
  `rules/migration.md`, `rules/operacao.md` e `rules/restrictions.md`.
- Provocação de sessão longa: identificou `handoff.md`, limite de 25 linhas,
  estado de Git/banco/publicação e próximo passo; não escreveu por ser leitura.
- A prova de retomada por uma sessão limpa será registrada ao fim da tarefa.
- As rules são mais extensas que a orientação de concisão da aula; não
  remover garantias operacionais apenas para reduzir contagem de linhas.

## Aula 10 — skill e MCP

- Uma skill autoral: `skills/revisar-interface-empres-ti/SKILL.md`, descoberta
  via `AGENTS.md`, sem cópias por harness. Origem/licença de terceiros não se
  aplica a essa skill escrita no próprio projeto.
- Prova positiva em sessão limpa `prova_skill`: pedido de conferir identidade,
  campos e botão ativou a skill sem mencionar seu nome; leu spec e ADRs.
- Prova negativa em sessão limpa `provas_regras`: análise de política de atraso
  não ativou a skill e não carregou seu corpo.
- Achado da revisão: placeholder `--text-faint` sobre `--surface-sunken` tem
  contraste aproximado 3,37:1, abaixo de AA para 14px. As cores vêm da referência
  aprovada; não alterar ADR-003 como efeito colateral desta tarefa.
- MCP: auditoria e resultado de chamadas reais em `mcp.md`.
- O plugin Supabase disponível nesta sessão tem ferramentas de escrita e de
  conta; não prova que `.mcp.json` foi carregado. Nenhuma delas será usada para
  alterar o projeto. O acesso restrito deve ser comprovado no servidor próprio.

## Aula 11 — verificador

- Papel somente leitura em `agents/verificador-spec.md` com entradas obrigatórias,
  tabela por CA e proibição de corrigir, migrar ou aprovar sem teste.
- `AGENTS.md` descobre; `rules/spec-flow.md` exige; delegação passa spec e escopo.
- Checks do verificador precisam de autorização explícita na delegação e alvo
  local conhecido. Um resultado `NÃO PRONTA` é válido e não autoriza correções.
- A spec 001 continua incompleta: o exercício não autoriza declará-la pronta
  nem implementar todo o PRD para obter um veredito verde.
- Foi acrescentado teste real para CA-08 na tela existente, sem novas dependências,
  usando renderização React; não cobre sessão, banco ou navegação hidratada.
- Provas de prontidão, teste comentado, restauração e recusa de correção:
  resultados a registrar após execução em sessões limpas.

## Limites da conclusão

Não fabricar aprovação de negócio, execução em máquina limpa, ordem histórica
de commits, publicação ou bloqueio técnico de MCP a partir de texto de regra.
Commit, push, tag publicada, deploy e alteração de produção dependem das
autorizações específicas em `rules/operacao.md` e `rules/restrictions.md`.
