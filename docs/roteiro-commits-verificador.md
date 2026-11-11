# Roteiro de versionamento da primeira etapa

Proposta de 10/11/2026, preparada sem git add, commit, push ou tag. Fonte:
[operação](../rules/operacao.md). Não atribuir commits novos às provas antigas.
Os nomes abaixo são mensagens propostas, não hashes ou commits existentes.

## Pré-condições

- Recuperar o Docker local e repetir a suíte completa; fechar os checks antes
  de marcar a base como validada. Não usar banco remoto para substituir testes.
- Revisar a base local do login já implementado e organizar seus commits por
  tarefa aprovada, sem misturar código e regras. Ela contém alterações anteriores
  e não pode ser incorporada cegamente ao commit do verificador.
- Revisar todos os arquivos a versionar quanto a dados sensíveis. Excluir os
  HTMLs brutos com senha, arquivos .env, ZIP da entrega inicial e temporários.
- Manter a prova intencionalmente reprovada somente local; não fazer push,
  publicação ou disparar deploy automático nesse estado.

## Pacote da etapa 1 para revisão

Mudanças de regra/procedimento, em commit separado de código:

- AGENTS.md: instruções de descoberta/gatilho e adaptação já existentes na árvore;
- agents/verificador-spec.md;
- rules/spec-flow.md;
- docs/verificador-spec.md.

Código e teste técnico do executor, em tarefa/commit próprio:

- scripts/verificar-spec.ps1;
- scripts/verificar-login.ps1;
- scripts/verificador-runtime.ps1;
- scripts/testar-isolamento-verificador.ps1;
- scripts/provar-verificador.ps1;
- scripts/tests/verificador-runtime.test.ps1.

Registro documental e evidências, após revisão dos arquivos:

- ENTREGA.md;
- docs/matriz-verificador-pratica.md;
- docs/plano-pratica-sdd-subagentes.md;
- docs/roteiro-commits-verificador.md;
- docs/evidencias/fechamento-verificador-20261110.md;
- docs/evidencias/verificador-runtime-test-20261110.txt;
- docs/evidencias/replay-pareceres-verificador-20261110.json;
- conjuntos isolamento-verificador-20261110-01 e -02 (.json, .jsonl, .md, .stderr.txt);
- conjuntos verificador-20261110-prova01-base, -plantado e -restaurado (.json, .jsonl, .md);
- docs/evidencias/prova-verificador-20261110-prova01.json;
- handoff.md, no commit documental correspondente.

Relatórios históricos referenciados pelo ENTREGA.md precisam ser revisados
e incluídos na base documental para que seus links funcionem no clone. O mesmo
vale para a avaliação anterior e as specs do login. Não incluir todo o diretório
docs/evidencias sem revisão; há imagens e módulo compilado de outra tarefa.
Configuração MCP do principal é outra alteração já existente; não é prova de
isolamento e não será incluída por arraste no commit do executor.

## Dois commits reais da prova, após a base organizada

1. `test(verificador): prova plantada de CA-08` — inserir somente o link de
   cadastro no componente e preservar o teste existente; executar o mesmo escopo
   da prova com um novo ID, salvar o parecer REPROVADO e criar o commit local
   desse estado com as evidências pertinentes. A falha intencional fica explícita.
2. `test(verificador): restaura CA-08 após prova` — remover somente o erro,
   comprovar teste passando, obter a nova tabela com CA-08 ATENDIDO e registrar
   a restauração em outro commit, incluindo os resultados e hashes correspondentes.

O script provar-verificador.ps1 executa e restaura a prova local automaticamente;
não cria esses commits e não deve ser apresentado como se os tivesse criado.
A execução versionada precisa intercalar os commits nos estados reais, sob
autorização específica, com restauração garantida mesmo diante de falha.

Depois, completar os hashes reais no ENTREGA.md e conferir o histórico/diff.
O commit intencionalmente vermelho é evidência controlada, não uma entrega
funcional: não relaxar checks gerais nem publicar esse estado.

## Autorização pendente

É necessário pedido explícito para criar os commits locais da base revisada,
do pacote da etapa 1 e os dois estados da prova. A proposta não autoriza push,
tag ou deploy. A base anterior será apresentada com arquivos/diff próprios
antes de sua inclusão, sem transformar trabalho não revisado em aprovado.
