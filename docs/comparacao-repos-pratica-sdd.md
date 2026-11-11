# Comparação dos repositórios da prática SDD

Análise de 10/11/2026. Pedido: comparar estrutura, exigências e pegadinhas antes
de continuar o desenvolvimento, preservando as decisões próprias deste projeto.
Uma solução de colega é referência para análise, não nova fonte de autoridade.

## Escopo, revisões e limite da análise

| Projeto                                                                                                                              | Revisão pública examinada                                                              | Situação verificável no GitHub                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [Repo 1 — isaacnewton-tech/Emprest-TI](https://github.com/isaacnewton-tech/Emprest-TI/tree/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc) | f4d65c6c076da0a2cd37c0bf412e58c968bc38dc, main                                         | A tag entrega-pratica aponta para essa revisão.                                                                                       |
| [Repo 2 — GabrielMartinsss26/EmpresTI](https://github.com/GabrielMartinsss26/EmpresTI/tree/d17f8f0dcba964b876cf10ac14bda92ca5514dec) | d17f8f0dcba964b876cf10ac14bda92ca5514dec, main                                         | Nenhuma tag retornada na consulta; dev estava três commits atrás de main. O próprio documento de entrega mantém uma spec NÃO PRONTA.  |
| Nosso projeto                                                                                                                        | Branch codex/tela-inicial, HEAD bb98485 e árvore de trabalho com alterações anteriores | A análise considera os arquivos locais, incluindo o verificador desenvolvido depois desse commit. Não presume que estejam publicados. |

Foram consultados inventários recursivos, branches, tags, cabeças dos commits,
o diff real da restauração da prova do Repo 1 e fontes selecionadas de produto,
specs, regras, scripts, serviços, testes, migrations e evidências. Os arquivos
externos foram lidos em diretório temporário fora do projeto. Nenhum script,
teste, instalação, migration ou operação de autenticação dos colegas foi executado.
Não foram testados seus deploys ou bancos; resultados de produção abaixo são
declarações/evidências versionadas dos autores, não novas observações nossas.

O corpo do enunciado publicado no Repo 2 coincide com o nosso depois de
normalizar espaços e omitir o valor de credencial do material didático.
Ambos ainda dizem Pexels e empréstimo imediato. Alterações posteriores precisam
de fonte própria; a coincidência do enunciado não valida exceções particulares.

Nesta conversa, o operador confirmou a orientação do professor para usar
**Pixabay**. Essa é agora a fonte aprovada para nosso planejamento. A confirmação
não estende ao nosso projeto permissões ou exceções dos colegas.

## 1. O que é exigência comum e o que continua sendo escolha do projeto

| Fonte local                                                                                 | Exigência que devemos preservar                                                                                                                                                                                | O que não se torna obrigatório por aparecer nos colegas                                                                                                              |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Aula 7](../aulas/aula7-sdd-conceito.html) e [spec-flow](../rules/spec-flow.md)             | Decisão de negócio antes do código; spec → plano → tarefas; uma pasta por funcionalidade; CAs verificáveis; comportamento novo começa na spec                                                                  | Ter exatamente as mesmas pastas, números de spec, rotas e quantidade de documentos.                                                                                  |
| [Aula 8](../aulas/aula8-greenfield-ordem.html) e [andar zero](andar-zero.md)                | Provar que a stack aprovada funciona; separar esqueleto técnico de comportamento de produto                                                                                                                    | Criar spec de produto para toda tarefa de infraestrutura, ou importar o schema de outro projeto.                                                                     |
| [Aula 9](../aulas/aula9-regras-antes-primeira-spec.html) e [operação](../rules/operacao.md) | Definir autoridade, checks, segredos e responsabilidade de Git; testar se as regras são respeitadas                                                                                                            | Permissão automática para commit/push. A aula apresenta alternativas; a escolha dos colegas não altera nosso contrato.                                               |
| [Aula 10](../aulas/aula10-skills-mcp.html)                                                  | Skill descoberta por name/description, carregamento por necessidade, referências/scripts quando necessários; auditar material externo; MCP com privilégio mínimo                                               | Copiar a skill pronta, seu enquadramento, formato, biblioteca, cache ou permissões sem conferir o contrato e a documentação aplicável.                               |
| [Aula 11](../aulas/aula11-subagentes.html)                                                  | Papel descoberto, fluxo que exige verificação, entradas explícitas, contexto limpo, independência e provas reais                                                                                               | Usar necessariamente TOML, MCP próprio ou o mesmo lançador de um colega. A aula admite sessão nova quando o harness não suporta o papel.                             |
| [Prática](../pratica-sdd-subagentes/pratica-sdd-subagentes.html)                            | Cinco entregas; 12 equipamentos; arquivos 800×600 distintos, proveniência e revisão visual; empréstimo imediato; escrita no deploy pelo operador; professor com zero empréstimos; ENTREGA.md, evidências e tag | Alterar limite, prazo, papel do professor ou admitir ilustração porque outro responsável escolheu isso. Conflitos e lacunas precisam de decisão e registro próprios. |

Nosso AGENTS/PRD/ADRs e nossas rules continuam governando implementação e
arquitetura. Não foi adotado novo framework, modelo de dados ou contrato de
operação por meio desta análise.

Exemplo concreto: a [operação R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/rules/operacao.md)
permite ao agente commitar cada tarefa; a
[operação R2](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/rules/operacao.md)
permite commits locais depois dos checks. Aqui continua valendo pedido explícito
para commit. A diferença é uma escolha de operação prevista na aula 9, não
evidência de que devemos copiar a permissão mais ampla.

## 2. Comparação de estrutura e comportamento

| Aspecto               | Repo 1                                                                                       | Repo 2                                                                                  | Consequência para nós                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stack                 | Next App Router, tRPC, Prisma, Supabase; monolito                                            | Mesma família de stack, também monolito                                                 | A organização Router → Service → Prisma já está alinhada. Preservar nosso ADR e pnpm 11.19.0; ambos usam npm.                                                      |
| Specs desta prática   | 003 verificador, 004 imagens, 005 dados, 006 solicitação                                     | 004 dados, 005 solicitação/aprovação; agente e infraestrutura próprios                  | Manter 001-login; dados/solicitação continuam planejados como 002/003. Não renumerar para imitar os colegas nem criar specs operacionais só para igualar a árvore. |
| Modelo persistido     | Cinco models, incluindo imagem/crédito no equipamento                                        | Dez models, com Profile, EquipmentImage, LoanRequest e regras versionadas de prazo      | Nosso modelo tem cinco models. A diferença não é falta de padrão; precisamos somente das mudanças justificadas pelas nossas specs.                                 |
| Criação do empréstimo | Imediata                                                                                     | Pedido PENDING; aprovação cria Loan                                                     | Nosso fluxo permanece imediato. Não implementar aprovação, rejeição ou painel mínimo de Operações para reproduzir o Repo 2.                                        |
| Limite                | Cinco abertos                                                                                | Três ativos                                                                             | Nosso limite três já foi decidido. Não usar o número de outra implementação como critério de correção.                                                             |
| Prazo                 | Exclui o dia do pedido, inclui feriados nacionais/estaduais/municipais de SP; vence às 23h59 | Conta após aprovação, exclui o próprio dia e só pula fins de semana; mantém horário     | Nosso prazo inclui a solicitação se útil, exclui feriados nacionais e mantém o horário America/Sao_Paulo. Nenhum dos dois cálculos pode ser transplantado.         |
| Professor             | Colaborador, separado da conta de teste                                                      | COLLABORATOR, com conta de teste separada                                               | Uma conta do professor ADMIN, com funções pessoais e administrativas, conforme nossa decisão; testes de empréstimo usam outra conta.                               |
| Imagens               | Pixabay, JPEG, margens brancas e recortes aprovados individualmente                          | Pixabay, WebP, foto inteira com margens; exceção de ilustração e inscrições técnicas    | Pixabay agora confirmado aqui. Formato, enquadramento e tratamento de texto ainda precisam de decisão; não herdamos exceções visuais.                              |
| Seed                  | Sincroniza itens nunca usados; preserva os já utilizados                                     | Cria ausentes/reutiliza compatíveis; conflitos interrompem o lote                       | Duas políticas possíveis de reexecução, não um padrão único. Nossa spec 002 deve definir a política antes do código.                                               |
| Verificador           | Snapshot de commit, pacote numerado e anexos visuais                                         | Sessão restrita, agente TOML e MCP local de leitura/descoberta                          | Nosso snapshot numerado e CLI restrito são uma terceira adaptação. Precisamos comprovar sua suficiência para o escopo, não copiar um lançador inteiro.             |
| CI                    | Não há workflow .github/workflows na árvore examinada                                        | Workflow tem suites unitária, técnica, imagens, banco e E2E, com publicação condicional | Nosso workflow existe, mas não chama os testes técnicos PowerShell nem o navegador. Há trabalho de integração a avaliar, não motivo para copiar o workflow remoto. |

Fontes de comportamento: [spec de solicitação R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/docs/specs/006-solicitar-emprestimo/spec.md),
[spec de solicitação R2](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/docs/specs/005-solicitar-emprestimo/spec.md),
[seed R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/prisma/seed.ts),
[população R2](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/prisma/dados-pratica.ts),
[schema R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/prisma/schema.prisma),
[schema R2](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/prisma/schema.prisma)
e [nosso PRD](PRD.md). A tabela resume escolhas documentadas, não aprova
automaticamente sua compatibilidade com a avaliação da turma.
Os suites do Repo 2 são chamados explicitamente no
[workflow versionado](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/.github/workflows/ci.yml);
existência do workflow não foi tratada como confirmação de execução verde.

## 3. Pegadinhas comprovadas pela comparação

### Repositório apresentado como concluído ainda pode conter reprovação

O Repo 2 informa spec 004 NÃO PRONTA e ausência de tag em seu
[ENTREGA.md](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/ENTREGA.md).
A [revisão da conta](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/docs/verificacoes/verificador/conta-revisao-integral.md)
mantém CA-D07 NÃO ATENDE: há caminho de escrita em produção e registro de
credencial compartilhada no histórico. A mesma revisão considera outros CAs
atendidos. Isso mostra por que não substituir a tabela por “o site funciona”.

No Repo 1 há tag e tabelas de prontidão, mas a checagem de produção continua
sendo um relato do autor nesta análise. Não fizemos nova validação do deploy.

### Spec aprovada não corrige sozinha uma fonte vigente divergente

O [PRD do R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/docs/PRD.md)
ainda diz três itens e 14 dias; a spec 006 registra outra decisão. Para nós,
preservar a decisão local e manter coerência entre fontes evita que uma sessão
futura escolha uma regra diferente. O limite cinco não será importado.

A aprovação do Repo 2 é uma divergência deliberada até mesmo da decisão
explícita de empréstimo imediato da prática, registrada pelo responsável na
[revisão de regras](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/docs/adr/004-revisao-regras-pratica.md).
Esse registro não prova aceitação acadêmica da exceção. Aqui a criação
imediata já foi confirmada e não há essa exceção.

### Hash identifica arquivo; não prova que a foto foi examinada

O R1 registra reprovação quando o pacote não permitia ao verificador ver as
imagens; o lançador passou a fornecer anexos com hashes conferidos. Sua
[rodada de imagens](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/docs/verificacoes/004-imagens-equipamentos/2026-11-05T13-56-59.541Z-da58cc90.md)
e o [lançador](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/scripts/verificar-spec.mjs)
são referências úteis para formular a prova, sem copiar a implementação.

Nosso lançador atual só fornece texto. Para um CA visual, precisaremos de
acesso controlado às imagens finais ou de outro procedimento independente
que realmente as examine, sempre associado aos bytes aprovados.

### A exceção de um colega não altera o contrato visual

A [skill R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/skills/imagens-equipamentos/SKILL.md)
permite recortes com nova revisão. O
[ADR de imagens R2](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/docs/adr/005-imagens-equipamentos.md)
admite inscrições técnicas e uma ilustração específica. Nenhuma dessas
permissões foi recebida para nosso projeto. Uma candidata difícil de encontrar
não autoriza imagem gerada, ilustração, logo ou reutilização de outra foto.

### Idempotência não é somente upsert

As políticas de seed dos dois projetos divergem sobre dados já editados.
Precisamos definir: sincronizar nunca utilizados ou recusar conflito; como
tratar membership incompatível; quando reutilizar conta existente; e como
preservar empréstimos/histórico e imagens. Não criar a conta de correção de
novo, redefinir acesso ou reabrir equipamento como efeito da repetição.

### O índice do equipamento não protege o limite da pessoa

O [serviço R1](https://github.com/isaacnewton-tech/Emprest-TI/blob/f4d65c6c076da0a2cd37c0bf412e58c968bc38dc/src/server/services/emprestimos.ts)
usa transação serializável e retentativas. O
[serviço de aprovação R2](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/src/server/services/request-approval.ts)
usa locks e ordem de aquisição. São estratégias diferentes para invariantes
semelhantes. Nossos testes devem cobrir disputa pelo mesmo item e por itens
diferentes quando a pessoa já tem dois, além de rollback se a auditoria falhar.
O algoritmo será escolhido no nosso plano técnico, compatível com o schema.

### Migration de prazo depende do banco de partida

O R2 tinha uma constraint de exatamente 14 dias corridos na
[migration inicial](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/prisma/migrations/202610190001_initial/migration.sql)
e introduziu regra versionada em
[outra migration](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/prisma/migrations/202611090001_loan_due_rules/migration.sql).
Nossa [constraint atual](../prisma/migrations/20260914110100_constraints/migration.sql)
só exige dueAt posterior a issuedAt. Não precisamos importar sua coluna,
triggers e backfill para mudar o cálculo. Qualquer DDL nosso precisa de
necessidade demonstrada, proposta e autorização; imagens ainda exigem decidir
sua persistência. Não recalcular datas históricas silenciosamente.

### Comando local pode continuar apontando para produção

O Repo 2 documenta que o ambiente de desenvolvimento compartilhava o Supabase
do deploy e registra interpretação indevida de ajuda como autorização de
escrita. O [registro da prática](https://github.com/GabrielMartinsss26/EmpresTI/blob/d17f8f0dcba964b876cf10ac14bda92ca5514dec/docs/pratica.md)
preserva essa ocorrência. Nossos testes devem continuar derivando destinos
descartáveis locais, sem herdar DATABASE_URL/DIRECT_URL reais. Escritas do
deploy continuam humanas; autorização genérica ou ADR de outro projeto não
concede essa permissão aqui.

Bucket público também não significa upload público: leitura e operações de
escrita têm tratamento distinto na
[documentação do Storage](https://supabase.com/docs/guides/storage/buckets/fundamentals).
A prova precisa verificar as duas direções.

## 4. Pixabay confirmado: implicações para a próxima etapa

A troca de provedor foi confirmada pelo operador nesta conversa por orientação
do professor, e já pode atualizar nosso planejamento. Consultamos a
[API oficial](https://pixabay.com/api/docs/) e a
[licença do provedor](https://pixabay.com/service/license-summary/).

- A API distingue photo/illustration/vector; a busca deve filtrar fotografias.
- O cache de consultas é exigido por 24 horas. Respeitar limites e erros sem
  gerar buscas/downloads em massa para tentar fechar o inventário.
- URLs da API servem para busca temporária; uso permanente exige baixar os
  arquivos e servi-los pelo armazenamento previsto, sem hotlink permanente.
- Filtros de busca não aprovam ausência de marca, pessoa, texto ou tela.
- Manter créditos do contrato da prática, adaptados para “Fotos: Pixabay”, e
  proveniência individual. Não atribuir à licença nova as condições do Pexels.
- A chave aparece como parâmetro da API; erros, URLs e logs precisam impedir
  sua exposição. Não será solicitada nem usada nesta análise documental.

800×600, unicidade, identidade dos equipamentos, revisão real e ausência de
upload pelo preparador continuam exigidos. JPEG/WebP, cortes, margens, textos
técnicos e orçamento de busca ainda dependem de proposta e decisão locais.

## 5. Lacunas concretas do nosso projeto antes de avançar

| Ponto local                                     | Evidência e consequência                                                                                                                                                         | Tratamento a preparar; ainda não implementado por esta análise                                                                                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entradas do verificador                         | [verificar-spec.ps1](../scripts/verificar-spec.ps1), linhas 22 e 49: só aceita md/ts/tsx/prisma/sql e testes em src. Não envia anexos visuais                                    | Adequar somente os tipos/entradas necessários ao escopo futuro. Scripts mjs/ps1, manifests JSON ou fotos não podem ser considerados inspecionados se não forem fornecidos. Não liberar leitura genérica de segredos.               |
| Ambiente e fontes da sessão                     | Nosso executor fornece hashes da árvore local; os colegas também usam ambiente mínimo e, no R1, snapshot do commit                                                               | Considerar ambiente explícito sem credenciais de banco/deploy e vinculação ao commit depois de versionar. É reforço de implementação, não obrigação de copiar MCP ou archive do colega.                                            |
| CI dos testes técnicos                          | [ci.yml](../.github/workflows/ci.yml) roda pnpm test/lint/typecheck/build, mas não os [14 testes PowerShell](../scripts/tests/verificador-runtime.test.ps1) nem o navegador      | Planejar integração compatível com o runner e confirmar execução. Teste técnico local não deve ser descrito como proteção já presente no CI.                                                                                       |
| Credencial de preparo versus segredo de runtime | [secrets.md](../rules/secrets.md) exige toda variável nova na Vercel; a chave de busca só será usada no preparo local                                                            | Apresentar alternativas: arquivo de credencial local ignorado e isolado do runtime, ou revisão explícita do escopo da regra. Não enviar a chave à Vercel automaticamente nem criar exceção silenciosa.                             |
| Gatilho obrigatório                             | Regra e registros históricos existem; novas rodadas controladas foram chamadas explicitamente                                                                                    | Preservar distinção entre parser de aprovação e prova de acionamento sem nomear o verificador. Conferir os registros da aula e completar a prova atual se necessário, sem exigir hook global só porque outro harness o permitiria. |
| Encerramento da etapa 1                         | [Fechamento técnico](evidencias/fechamento-verificador-20261110.md): prova restaurada, checks estáticos/build aprovados, suíte integral impedida pelo Docker e commits pendentes | Recuperar ambiente local e fechar os checks e histórico exigidos. Não usar sucesso dos colegas para promover nosso estado a concluído.                                                                                             |
| Funcionalidades e persistência                  | Seed ainda só cria tenant; não há skill, campos de imagem/crédito, specs 002/003 ou catálogo/empréstimo publicados por esta tarefa                                               | Manter o fluxo de perguntas → spec/plano aprovados → DDL quando necessário → tarefas/testes → verificador → execução humana no deploy.                                                                                             |

Os reforços técnicos desta tabela são propostas para planejamento. Não são
novas decisões de arquitetura ou autorização para instalações, alterações de
regras, migrations, commits e publicação.

## 6. Sequência recomendada, preservando o plano existente

1. Fechar as pendências reais do verificador/ambiente/histórico. Revisar como
   a evidência de imagens e scripts será disponibilizada antes de depender
   desse mecanismo para aprovar a próxima etapa.
2. Apresentar a skill de imagens com Pixabay: segredo só do preparo, formato,
   enquadramento, revisão e bloqueio de envio. Escolher com o operador apenas
   as decisões ainda abertas; não repetir perguntas já respondidas.
3. Escrever a spec 002 com reexecução, inventário, metadados e provisionamento
   do professor ADMIN. Propor DDL conforme nosso schema, sem transplantar models.
4. Escrever a spec 003 com criação imediata, limite três e nosso calendário.
   Testar isolamento, concorrência, auditoria e fluxo de interface completo.
5. Registrar evidências locais/CI/deploy separadamente, concluir ENTREGA.md
   com decisões próprias, verificar produção com conta de teste e marcar a
   tag somente no commit final conferido e autorizado.

Nosso trabalho pode aprender com a evidência anexada e com as reprovações dos
colegas. As escolhas que serão implementadas devem continuar saindo das fontes
e decisões deste projeto. Não foi copiado código, skill, migration, ADR ou
justificativa pessoal para a implementação.
