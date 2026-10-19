---
description: Contrato de operacao entre mim e o agente neste projeto
globs: []
alwaysApply: true
---

# Contrato de operação

## Git

> leitor: agente

- Commit: somente quando o operador pedir explicitamente.
- Push: somente quando o operador pedir explicitamente e indicar o destino.
- A mensagem de commit cita a tarefa e o critério de aceitação.
- Um commit por tarefa. Nunca junte código e mudança de regra
  no mesmo commit.

## Autorização por tipo de ação

> leitor: agente

| ação                                      | nível         |
| ----------------------------------------- | ------------- |
| Editar arquivo existente dentro do escopo | livre         |
| Criar arquivo novo dentro do escopo       | avisar depois |
| Deletar ou renomear arquivo               | pedir antes   |
| Instalar ou atualizar dependência         | pedir antes   |
| Criar ou alterar migration                | pedir antes   |
| Alterar produção ou executar deploy       | pedir antes   |
| Alterar segredo real                      | proibido      |

O que cada nível significa:

- livre — faça e siga em frente.
- avisar depois — faça e me diga na resposta o que fez.
- pedir antes — descreva o que pretende fazer e PARE.
- proibido — não faça, mesmo que eu peça no meio de uma tarefa.
  Se eu pedir, me lembre desta linha.

Produção e deploy exigem autorização explícita do operador para a ação,
o ambiente e o destino exatos. Antes de executar, avise que a operação altera
um ambiente externo e recapitule o impacto esperado. Autorização genérica como
"pode executar" não cobre produção nem deploy.

## Configuração do operador

> leitor: humano — isto não é instrução para o agente

| fase                            | modelo / raciocínio |
| ------------------------------- | ------------------- |
| Escrever a spec                 | raciocínio alto     |
| Planejar e quebrar em tarefas   | raciocínio alto     |
| Executar uma tarefa já decidida | rápido              |
| Debugar algo que quebrou        | raciocínio alto     |
| Revisar o diff antes do commit  | padrão              |

- Revisão de diff acontece em sessão limpa, de preferência com
  modelo diferente do que escreveu o código.
- Sessão longa não se corrige com regra mais enfática: encerre
  seguindo rules/handoff.md e abra outra.
