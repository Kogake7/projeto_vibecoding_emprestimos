# Fluxo de uma funcionalidade

> Leitor: agente

## Quando

Ao iniciar funcionalidade do PRD ou mudar comportamento de uma spec existente.

## Procedimento

1. Liste lacunas do PRD e aguarde respostas antes de fechar `docs/specs/<NNN-nome>/spec.md`.
2. Derive `plan.md` da spec, citando ADRs; derive `tasks.md` do plano, com CA por tarefa e tamanho de um commit.
3. Só escreva código após aprovação da spec e do plano; execute uma tarefa por vez com `rules/checks.md`.
4. Mudou comportamento? Atualize e aprove a spec antes dos artefatos derivados e do código.

## Não faça

- Não crie spec fora do padrão numérico nem transforme ADR, regra operacional ou detalhe interno em critério de produto.
- Não escreva a spec depois do código apenas para descrevê-lo.

## Antes de declarar uma spec pronta

- Delegue a `agents/verificador-spec.md` o caminho da spec e o escopo (commits, arquivos ou toda a implementação), em contexto limpo.
- Sem subagentes, use sessão limpa com as mesmas entradas; autorize apenas checks locais de destino conhecido.
- Exija `Veredito: PRONTA`; outro resultado volta às tarefas. Quem corrige é o principal, nunca o verificador.
- Gatilho: ao terminar a última tarefa ou responder se uma spec está pronta,
  execute a conferência antes de responder; não aguarde pedido separado.
- Neste harness, use `scripts/verificar-spec.ps1` com spec, fontes do escopo,
  testes revisados de destino local e identificador único da rodada. O script
  fornece as fontes a uma sessão limpa sem shell/apps/plugins, em `read-only`.
  Um subagente herdando escrita não substitui essa prova de isolamento.
- Preserve relatórios e hashes de cada rodada em `docs/evidencias/`; compare os
  mesmos IDs de CA. Falha de execução ou fonte insuficiente nunca significa pronta.
- O executor deve recusar testes/CLI falhando, fontes alteradas, veredito ausente
  ou diferente de PRONTA e tabela incompleta de CAs ATENDIDOS com evidência.
  Essa validação ocorre em `scripts/verificador-runtime.ps1`; não substitui
  análise semântica da evidência nem validação remota. O gatilho de invocação
  continua obrigatório neste fluxo, sem alegação de hook global instalado.
