# Fluxo de uma funcionalidade

> Leitor: agente

## Quando

Ao iniciar qualquer funcionalidade nova do PRD.

## Procedimento

1. Crie `docs/specs/<NNN-nome-curto>/spec.md` e liste lacunas do PRD antes de fechar requisitos.
2. Produza `plan.md` a partir da spec, citando os ADRs aplicáveis.
3. Produza `tasks.md`; cada tarefa referencia ao menos um `CA-xx` e cabe num commit.
4. Implemente uma tarefa por vez e valide conforme `rules/checks.md`.

## Não faça

- Não escreva código da feature antes de a spec e o plano estarem aprovados.
- Não crie specs fora do padrão numérico.
- Não transforme ADR, regra operacional ou detalhe de implementação em critério de produto.
