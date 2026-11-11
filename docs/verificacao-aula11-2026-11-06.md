# Aula 11 — integração do verificador e conferência inicial

## Escopo autorizado

Em 06/11/2026, o operador restringiu o trabalho aos requisitos das aulas,
excluindo a nova prática `aulas/pratica-sdd-subagentes.html` desta tarefa.
Não foi autorizada por inferência a implementação de todo o MVP do PRD.

Fonte: `aulas/aula11-subagentes.html`, seções “Três pontos de contato” e
“Antes de fechar o notebook”.

## Integração realizada

- `AGENTS.md` aponta o papel e exige entradas explícitas na delegação.
- `rules/spec-flow.md` exige o verificador antes de declarar uma spec pronta.
- A description em `agents/verificador-spec.md` inclui o fim da spec e a
  pergunta sobre prontidão; a correção continua exclusiva do principal.
- O principal delegou uma conferência somente leitura da spec
  `docs/specs/001-login/spec.md`, com escopo “tudo que implementa a spec”.

## Resultado da conferência

Não existe teste que cite CA-01 a CA-08 nos arquivos de `src`.
Os testes atuais cobrem política de empréstimos e health, sem autenticação.

| CA | Evidência de teste | Status | Observação |
| --- | --- | --- | --- |
| CA-01 | Ausente | SEM TESTE | Envio de login ainda não implementado. |
| CA-02 | Ausente | SEM TESTE | Falha de credenciais ainda não implementada. |
| CA-03 | Ausente | SEM TESTE | Proteção de rotas ainda não implementada. |
| CA-04 | Ausente | SEM TESTE | Renovação de sessão ainda não implementada. |
| CA-05 | Ausente | SEM TESTE | Contexto e bloqueio por membership ainda não implementados. |
| CA-06 | Ausente | SEM TESTE | Não há prova de isolamento por tenant no login. |
| CA-07 | Ausente | SEM TESTE | Resolução do papel ainda não implementada. |
| CA-08 | Ausente | SEM TESTE | Interface sem cadastro público, mas sem prova automatizada. |

Veredito: NÃO PRONTA. A integração do verificador não conclui a spec de login.
T-02 a T-04 continuam abertas, sem implementação nesta tarefa.

## Validação e limites

- Verificador executou `pnpm test`: exit 0, 2 arquivos e 10 testes passaram.
- `git diff --check`: passou, com avisos de conversão LF/CRLF.
- Caminhos documentais conferidos; nenhum código de produto foi alterado.
- Geração Prisma, lint, typecheck e build dispensados nesta alteração
  exclusivamente documental, conforme `rules/checks.md`.
- A delegação explícita não comprova disparo automático em sessão nova.
- O subagente recebeu histórico herdado nesta execução; portanto esta rodada
  não comprova o requisito de contexto limpo integral. Repetir em sessão limpa.
- Não foi comentado teste: a spec atual não tem teste de CA para essa prova.
- As quatro provas completas da aula 11 continuam pendentes; esta conferência
  inicial não as substitui. O verificador não realizou correções.
- Sem commit, push, deploy, migration ou alteração de ambiente externo.

## Demais pendências das aulas

Continuam identificadas no relatório `revisao-entrega-2026-11-05.md`: formato
das cinco perguntas (aula 7), reprodução do andar zero em banco descartável
(aula 8), registros das provocações (aula 9), provas da skill e auditoria/uso
do MCP (aula 10). A integração documental da aula 11 foi atualizada aqui;
o relatório anterior permanece como registro histórico.
