# Matriz de requisitos e evidências do verificador

Atualização posterior nesta mesma data: a implementação e as novas provas estão
em [fechamento técnico](evidencias/fechamento-verificador-20261110.md). O
inventário abaixo preserva o diagnóstico inicial; as pendências de parser,
pnpm adotado e registro bruto de bloqueio receberam tratamento nessa execução.
Commits exigidos e validação integral com Docker continuam pendentes.

Inventário documental de 10/11/2026. Corresponde à etapa 1, item 1 do
[plano da prática](plano-pratica-sdd-subagentes.md). Fontes: seção 02 do
[enunciado](../pratica-sdd-subagentes/pratica-sdd-subagentes.html), seção 6 do
modelo de ENTREGA.md, [papel](../agents/verificador-spec.md),
[fluxo obrigatório](../rules/spec-flow.md),
[executor](../scripts/verificar-spec.ps1) e registros locais abaixo.

Foram lidos código do executor, relatórios, metadados JSON, eventos JSONL e
histórico Git. Não houve nova execução do verificador, teste funcional,
tentativa de escrita ou acesso a serviço externo. Esta matriz não emite novo
veredito sobre uma spec nem conclui a entrega do verificador.

## Requisitos da seção 02

Os IDs V-01 a V-06 organizam este inventário; não são CAs de produto.
“Comprovado nas rodadas” descreve os registros examinados, sem certificação
de configurações futuras ou aprovação acadêmica da adaptação.

| ID   | Requisito                                                                                      | Evidência existente                                                                                                                                                                                                                                                        | Situação e limite                                                                                                                                                                                                                                                                              | Ação mínima restante                                                                                                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V-01 | Papel: conferir cada CA em contexto limpo e citar evidência                                    | [Papel](../agents/verificador-spec.md); [executor](../scripts/verificar-spec.ps1), linhas 51–65 e 93–119; [parecer final 03](evidencias/verificador-login-final-20261109-03.md) e [metadados](evidencias/verificador-login-final-20261109-03.json)                         | Comprovado nas rodadas: tabelas por CA, spec/escopo explícitos e sessões distintas. O principal seleciona e fornece as fontes; o verificador não descobre arquivos omitidos nem executa os checks.                                                                                             | Explicar essa divisão no ENTREGA.md e conferir a adaptação ao harness na próxima tarefa. Nas specs 002/003, fornecer o escopo completo de tela, API, serviço e persistência.                                                               |
| V-02 | Independência: devolver achados sem corrigi-los                                                | [Prova histórica](evidencias/verificador-2026-11-09.md), linhas 63–91; JSONs das três rodadas; [rodada final 01](evidencias/verificador-login-final-20261109-01.md) reprovou cobertura de CA-01/02 antes das correções do principal                                        | Comprovado nas rodadas: todos os seis JSONs registram sourcesUnchanged=true; os seis JSONLs contêm somente uma mensagem de agente como item, sem chamadas de ferramenta registradas. Isso não prova, isoladamente, indisponibilidade de ferramentas.                                           | Preservar as reprovações e distinguir correção pelo principal de nova conferência pelo verificador. Manter a recusa ao pedido do tech lead para corrigir testes.                                                                           |
| V-03 | Obrigatório: passar pelo verificador antes de declarar pronta, sem depender de pedido separado | [AGENTS](../AGENTS.md), linhas 51–56; [spec-flow](../rules/spec-flow.md), seção “Antes de declarar uma spec pronta”; [fechamento do login](evidencias/login-t02-t03-2026-11-09.md), linhas 151–171; [avaliação](avaliacao-pratica-sdd-subagentes.md), fechamento posterior | Parcial: o gatilho está nas instruções e há relato de acionamento no fechamento do login. Os eventos do verificador não mostram o que disparou a sessão. O executor não interpreta o veredito: exit 0 pode acompanhar NÃO PRONTA. Não há passo de conferência de veredito no CI atual.         | Na próxima conferência do harness, explicitar o que é obrigação do fluxo e o que é imposto por código; avaliar a suficiência da prova do gatilho e apresentar eventual mudança necessária. Não presumir aprovação por exit 0.              |
| V-04 | Seguro em produção: não conseguir publicar, migrar ou escrever no banco do deploy              | [Executor](../scripts/verificar-spec.ps1), linhas 114–119: sessão efêmera, read-only, aprovação never, shell/apps/plugins e MCP de banco desativados; [prova de bloqueio](evidencias/verificador-2026-11-09.md), linhas 31–46                                              | Parcial quanto à documentação verificável: existe relato de apply_patch rejeitado e o canário continua ausente. O log bruto dessa tentativa separada não está entre os seis conjuntos de rodadas examinados. Flags e declaração isolation nos JSONs não substituem prova atual de capacidades. | Conferir configuração e capacidades atuais na próxima tarefa; identificar se o evento bruto do canário pode ser recuperado sem expor dados ou se será necessária nova prova local inofensiva. Não testar bloqueio com escrita em produção. |
| V-05 | Comparável: confrontar rodadas da mesma spec lado a lado                                       | [Base](evidencias/verificador-2026-11-09-base.md), [plantado](evidencias/verificador-2026-11-09-plantado.md) e [restaurado](evidencias/verificador-2026-11-09-restaurado.md), acompanhados de JSON/JSONL e hashes                                                          | Comprovado nas três rodadas históricas: mesmo escopo, mesmo teste e mesmos IDs de CA. Base/restaurado têm todos os hashes iguais; base/plantado diferem somente no componente de login. A spec histórica tinha oito CAs; o login final tem onze.                                               | Usar os mesmos CAs/escopo na próxima prova; não comparar as rodadas históricas como se verificassem a versão final de onze CAs.                                                                                                            |
| V-06 | Provado: reprovar um erro plantado de propósito                                                | Três rodadas anteriores e [descrição do erro/restauração](evidencias/verificador-2026-11-09.md), linhas 68–83                                                                                                                                                              | Comportamento comprovado historicamente: CA-08 ATENDIDO → REPROVADO → ATENDIDO, com teste 0 → 1 → 0. Os dois commits exigidos pela seção 6 do ENTREGA.md não existem.                                                                                                                          | Preparar prova versionada após organizar a base e obter autorização explícita de commit. Se houver nova execução, usar IDs inéditos de rodada e registrar dois commits reais, sem atribuí-los às rodadas antigas.                          |

## Conferência dos registros existentes

As seis rodadas têm os três arquivos esperados (.md, .json e .jsonl), JSONs e
JSONLs legíveis e identificadores de sessão diferentes. Os eventos registram
thread.started, turn.started, item.completed e turn.completed em cada rodada.

| Rodada                                                                | pnpm registrado | Exit do teste | Exit CLI | Fontes preservadas durante a rodada | Resultado pertinente                                      |
| --------------------------------------------------------------------- | --------------- | ------------- | -------- | ----------------------------------- | --------------------------------------------------------- |
| [Base](evidencias/verificador-2026-11-09-base.json)                   | 11.25.0         | 0             | 0        | true                                | CA-08 ATENDIDO; spec NÃO PRONTA                           |
| [Plantado](evidencias/verificador-2026-11-09-plantado.json)           | 11.25.0         | 1             | 0        | true                                | CA-08 REPROVADO; spec NÃO PRONTA                          |
| [Restaurado](evidencias/verificador-2026-11-09-restaurado.json)       | 11.25.0         | 0             | 0        | true                                | CA-08 ATENDIDO; spec NÃO PRONTA                           |
| [Login final 01](evidencias/verificador-login-final-20261109-01.json) | 11.19.0         | 0             | 0        | true                                | CA-01/02 SEM TESTE integral; NÃO PRONTA                   |
| [Login final 02](evidencias/verificador-login-final-20261109-02.json) | 11.19.0         | 0             | 0        | true                                | Onze CAs ATENDIDOS; PRONTA para aquele snapshot           |
| [Login final 03](evidencias/verificador-login-final-20261109-03.json) | 11.19.0         | 0             | 0        | true                                | Onze CAs ATENDIDOS; PRONTA após a correção do POST nativo |

Todos registram Node v24.22.1 e codex-cli 0.167.0-alpha.3.2. As rodadas finais
demonstram uso do pnpm adotado, 11.19.0; não corrigem retroativamente a versão
11.25.0 da prova histórica com erro plantado. Uma nova prova deve usar a versão
adotada, sem instalar ou atualizar pacotes por inferência.

Na comparação atual com os 51 hashes do login final 03, coincidem os arquivos
de código, testes e demais fontes, exceto estes quatro documentos:

- docs/specs/001-login/spec.md;
- docs/specs/001-login/plan.md;
- docs/specs/001-login/tasks.md;
- docs/evidencias/login-t02-t03-2026-11-09.md.

O [registro de fechamento](evidencias/login-t02-t03-2026-11-09.md), linhas
161–162, informa adições documentais após o parecer. A comparação confirma a
ausência de diferença nos arquivos de código e testes incluídos naquele
snapshot; não reconstrói o conteúdo anterior dos quatro documentos. Antes de
usar o parecer para uma nova declaração sobre a spec atual, conferir a
semântica dessas alterações e seguir o gatilho de nova verificação.
sourcesUnchanged=true vale para a duração da rodada, não para todos os estados
posteriores do repositório.

## Versionamento e separação antes de commits

Branch observado: codex/tela-inicial. HEAD: bb98485. O histórico local listado
contém seis commits e nenhum commit posterior às provas de 09/11. Não há tag
local listada. Não foram consultados remotos, CI ou deploy.

| Grupo                                  | Situação observada                                                                                                                                                                            | Tratamento proposto antes de versionar                                                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Papel, executor e adaptação do harness | agents/verificador-spec.md, scripts/verificar-spec.ps1, scripts/verificar-login.ps1, docs/verificador-spec.md e .codex/config.toml não rastreados; AGENTS.md e rules/spec-flow.md modificados | Revisar os arquivos e separar mudanças de regra das mudanças de código, conforme operação. Não incluir toda a árvore em um único commit.                                                      |
| Evidências                             | docs/evidencias/ não rastreado, incluindo relatórios, metadados, eventos, imagens e módulo de navegador compilado                                                                             | Selecionar provas necessárias; revisar conteúdo sensível e decidir o tratamento do módulo gerado. Não apagar nem reescrever relatórios históricos para fazê-los corresponder ao estado novo.  |
| Login e infraestrutura anteriores      | Alterações em src/, package.json, lockfile, CI e Docker, além de docs/specs/001-login/                                                                                                        | Manter autoria e escopo separados do trabalho atual; preparar base verificável antes dos commits de plantio/restauração. Este inventário não revisou esses diffs integralmente.               |
| Material bruto de aula/prática e ZIP   | aulas/, pratica-sdd-subagentes/ e entrega-inicial/ não rastreados; a avaliação anterior registra senha literal no HTML do enunciado                                                           | Não adicionar cegamente esses diretórios. Fazer revisão de conteúdo antes de qualquer proposta de commit; este inventário não realizou varredura completa de segredos e não reproduz a senha. |
| Configurações de conexão               | .mcp.json, .codex/config.toml e docs/codex-mcp.config.toml não rastreados                                                                                                                     | Revisar escopo, ferramentas e ausência de segredos antes de versionar. Configuração do principal com MCP não comprova capacidades do verificador isolado.                                     |

## Pendências e sequência imediata

1. A conferência do harness foi realizada após o pedido “Complete a primeira
   tarefa”, interpretado como completar a etapa 1. O executor valida o parecer
   automaticamente; a prova atual registra bloqueio do host, sem atribuí-lo
   ao sandbox de arquivos. O gatilho segue obrigatório por instruções do fluxo.
2. A prova foi repetida com pnpm 11.19.0 e restauração exata, sem criar commits.
   O roteiro dos commits reais foi preparado; depende de base revisada e
   autorização específica, sem publicação do estado reprovado.
3. ENTREGA.md foi iniciado com fatos/pendências identificados. As tabelas
   finais de 002/003 dependem das specs futuras e não foram preenchidas.
4. A suíte completa foi tentada e falhou pela indisponibilidade do Docker
   local. Recuperar o ambiente e repetir os checks antes de encerrar a etapa
   integralmente. Não promover a prova parcial a novo parecer integral de login.

O [fechamento técnico](evidencias/fechamento-verificador-20261110.md) registra
resultados, arquivos e limites atuais. Nenhuma entrega acadêmica recebeu
aprovação externa nesta sessão.

## Validação deste inventário

- Leitura cruzada de papel, regras, executor e seis conjuntos de rodadas.
- Parsing dos seis JSONs e seis JSONLs, comparação de escopo, hashes e IDs
  de sessão; consulta ao histórico/status Git local, sem alterações no índice.
- A validação documental cobre links locais, caminhos, formatação e limite
  de linhas do handoff; resultados registrados no retorno da tarefa.
- Suíte funcional, build, CI e verificações remotas não executados nesta
  tarefa exclusivamente documental, conforme rules/checks.md.
