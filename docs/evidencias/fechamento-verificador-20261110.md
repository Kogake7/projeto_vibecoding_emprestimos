# Fechamento técnico do verificador — 10/11/2026

Escopo autorizado: completar a primeira etapa do
[plano](../plano-pratica-sdd-subagentes.md), sem iniciar a skill de imagens ou
as funcionalidades de dados/empréstimos. Este registro distingue trabalho
executado de validação impedida e histórico Git ainda não autorizado.

## Resultado técnico

O executor agora recusa aprovação quando os testes/CLI falham, as fontes mudam,
o veredito não é único e PRONTA ou falta uma linha ATENDIDO com evidência por
CA. A decisão e os hashes do executor/runtime ficam no JSON da rodada. Os
relatórios de reprovação são preservados antes do erro de saída.

Os testes técnicos de aceitação têm
[14 casos positivos/negativos aprovados](verificador-runtime-test-20261110.txt),
sem banco ou chamadas ao CLI. Conferem relatório positivo, NÃO PRONTA, teste
falhando, CLI falhando, alteração de fonte, CA ausente/duplicado/extra, SEM TESTE,
evidência vazia, dois vereditos, relatório vazio e spec sem IDs válidos.

Isso operacionaliza a regra de aprovação existente. O acionamento ao terminar
uma spec ou responder sobre prontidão continua obrigatório nas instruções de
AGENTS/rules/spec-flow, sem alegação de hook global nem bloqueio universal de
texto em conversa. O principal ainda confere a semântica da evidência.

Além dos casos isolados, o [replay de quatro relatórios reais](replay-pareceres-verificador-20261110.json)
aceitou o parecer completo final 03 e recusou final 01 e as novas provas parciais
base/plantado. É validação do parser sobre registros, não nova conferência das
fontes atuais nem substituição do verificador independente.

## Isolamento: o que foi observado

A [rodada atual 02](isolamento-verificador-20261110-02.json) usa o mesmo
runtime do executor; registra argumentos e hashes. O canário tinha caminho
novo e fixo dentro de docs/evidencias. O CLI tentou encaminhar a operação,
mas o host de ferramentas desativado a rejeitou antes de apply_patch executar.

- [Eventos brutos](isolamento-verificador-20261110-02.jsonl): erro de host indisponível.
- [Stderr](isolamento-verificador-20261110-02.stderr.txt): tools::router com
  `error=code-mode host is disabled`.
- [Relato da sessão](isolamento-verificador-20261110-02.md): nenhuma repetição
  ou tentativa de habilitar recursos.
- Metadados: CLI exit 0, observedHostBlock=true e existsAfter=false.

A primeira [rodada 01](isolamento-verificador-20261110-01.json) também foi
preservada. A 02 acrescenta validação automática dos erros brutos pelo script.
Nenhum canário foi criado, removido ou enviado a serviço externo.

Esta prova comprova o bloqueio do host nesta configuração, sem afirmar nova
tentativa contra o sandbox de arquivos. O schema ainda expôs nomes de
colaboração; portanto, não se afirma ausência de toda ferramenta. Shell,
apps/plugins, MCP de banco e demais flags operacionais ficam configurados
como desativados no runtime. Não foram chamadas ferramentas de produção.
A sessão independente é a adaptação expressamente permitida pelo AGENTS;
não equivale a configurar sandbox próprio num subagente nativo.

## Erro plantado e restauração

Com Node 24.22.1 e pnpm 11.19.0, executado:

```powershell
pnpm --package=pnpm@11.19.0 dlx pnpm exec pwsh -NoProfile -File scripts/provar-verificador.ps1 -Round '20261110-prova01'
```

Mesmo escopo de interface, spec atual de onze CAs e mesmo teste nas três
rodadas. O principal inseriu temporariamente um link público de cadastro antes
do formulário; não criou rota de cadastro nem alterou o teste para acomodar
o erro. O próprio script restaurou os bytes originais em finally.

| Rodada                                                   | Exit do teste | CA-08     | Veredito   | Decisão automática da spec |
| -------------------------------------------------------- | ------------- | --------- | ---------- | -------------------------- |
| [Base](verificador-20261110-prova01-base.md)             | 0             | ATENDIDO  | NÃO PRONTA | Recusada                   |
| [Plantado](verificador-20261110-prova01-plantado.md)     | 1             | REPROVADO | NÃO PRONTA | Recusada                   |
| [Restaurado](verificador-20261110-prova01-restaurado.md) | 0             | ATENDIDO  | NÃO PRONTA | Recusada                   |

O CLI terminou com exit 0 e sourcesUnchanged=true em cada rodada; o executor
recusou as três por insuficiência de cobertura da spec inteira. O script de
prova capturou essas recusas esperadas e aprovou somente a sequência do CA-08.

O [resumo de hashes](prova-verificador-20261110-prova01.json) confirma componente
e teste idênticos antes/depois. Componente:
`63696FE42C4482753085EF6D582F36F4C2DB77366CBB0274A35C5A149F0E1DF6`.
Teste: `DFF7F1241074ACD4111CA7A6901BDDA9933BBA4AD62EE075552C4D713EED0092`.
Cada rodada preserva JSON e JSONL com o mesmo prefixo.

Não foram criados commits. A nova prova resolve a repetição na versão de pnpm
adotada, mas não substitui os dois commits exigidos. Não altera as provas de
09/11 nem transforma a conferência parcial em aprovação de uma spec completa.

## Checks de aplicação e impedimento local

Com Node 24.22.1 e pnpm 11.19.0:

- db:generate: exit 0.
- lint: exit 0.
- typecheck: exit 0.
- test: exit 1; quatro arquivos passaram (20 testes) e três suítes não
  inicializaram PostgreSQL local, deixando 35 testes sem executar.
- build: exit 0 após a restauração; rotas /, /login, /app, /api/health,
  /api/trpc/[trpc] e proxy gerados. Aviso de nova versão do Prisma não levou
  a instalação ou atualização.

Docker Desktop estava parado e foi iniciado de forma oculta. O daemon local
respondeu erro HTTP 500 e depois timeout de 15 segundos. A tentativa de iniciar
o serviço com.docker.service foi recusada por falta de acesso ao serviço.
As duas distribuições Docker do WSL estavam Running. Não houve reset de Docker,
exclusão de volume, troca de banco, atualização de dependência ou acesso remoto.
Um build lançado antes do encerramento da prova foi interrompido e substituído
por uma execução após restauração do componente; não é contado como aprovação.

A falha de ambiente não foi mascarada nem resolvida alterando testes. O login
mantém seu parecer histórico sobre o snapshot de 09/11; esta sessão não emitiu
nova aprovação integral. CI, Preview e produção não foram validados.

## Documentação e próximo passo

ENTREGA.md foi iniciado com decisões existentes, alternativas e pendências
identificadas. Procedimento, papel e regra de conclusão foram alinhados ao
executor; não houve alteração de PRD, ADR, schema, migration ou comportamento
final do produto nesta etapa.

O [roteiro de versionamento](../roteiro-commits-verificador.md) descreve o pacote
e os commits ainda dependentes de autorização. A etapa não será declarada
integralmente encerrada enquanto faltarem os commits exigidos e os checks
obrigatórios da aplicação. Aceitação acadêmica da adaptação não foi presumida.

Links locais, formatação e sintaxe PowerShell foram conferidos. Uma varredura
limitada de padrões de chaves, tokens e URLs com credencial não encontrou
ocorrências nos arquivos da tarefa; não é certificação do histórico inteiro.

## Etapa posterior à comparação — ambiente mínimo e CI técnico

O pedido de desenvolver em etapas autorizou a próxima tarefa de reforço do
verificador no nosso repositório. Foram reutilizados runtime, lançadores,
testes e workflow existentes, sem importar arquivos dos colegas.

- O runtime filtra o ambiente por lista de nomes de inicialização e executa
  o filho com ambiente limpo, sem alterar as variáveis do processo principal.
  Variáveis de banco, aplicação e provedores não são encaminhadas.
- A autenticação interna do CLI por arquivo continua disponível; não há
  alegação de revogação dessa autenticação nem de isolamento de toda leitura.
- Argumentos são passados sem shell; stdin/stdout/stderr usam UTF-8, há timeout
  e encerramento do processo filho. Somente nomes de variáveis vão ao recibo.
- A suíte técnica passou com 17 casos. A regressão reproduz a herança de uma
  sentinela na invocação nativa anterior e confirma sua ausência no processo
  filtrado, com stderr/código de retorno e ambiente do principal preservados.
- O workflow existente passa a chamar essa suíte com shell pwsh. Não instala
  módulos nem chama Codex/banco/rede nesses testes. Execução remota do CI não
  foi realizada, pois não houve commit/push.
- A [nova prova do CLI](isolamento-verificador-20261110-04-env.json), com
  [eventos](isolamento-verificador-20261110-04-env.jsonl) e
  [stderr](isolamento-verificador-20261110-04-env.stderr.txt), confirmou exit 0,
  observedHostBlock=true, canário ausente e somente nomes permitidos de ambiente.
  Os hashes identificam o runtime e o script da prova. Uma tentativa anterior
  falhou antes de iniciar o CLI porque a resolução retornou dois executáveis;
  os lançadores passaram a selecionar o primeiro resultado da resolução local.
- Novamente passaram geração Prisma, lint e typecheck com Node 24.22.1/pnpm
  11.19.0. A suíte completa novamente falhou na inicialização do PostgreSQL:
  20 testes passaram e 35 não executaram. Build terminou com exit 0 após esses
  checks; rotas existentes e proxy foram gerados normalmente.
- Docker retornou timeout. O helper de interface também deu timeout em
  list_apps, inclusive após recuperação; nenhuma janela foi inspecionada ou
  controlada, configuração alterada ou dado apagado por essa tentativa.

A tarefa não alterou produto, schema, ADRs, dependências ou repositórios
alheios. Anexos visuais, tipos de fontes adicionais e escolhas da skill
Pixabay continuam em tarefas posteriores; a etapa 1 inteira mantém as
pendências de ambiente, histórico e validação remota já registradas.

## Retomada — Docker recuperado e preparação HTTP ainda pendente

O pedido para continuar a próxima tarefa foi aplicado à recuperação do Docker
e à repetição da suíte local. A instalação existente do Docker Desktop foi
iniciada de forma oculta; após inicializar o backend WSL, o endpoint local
`npipe:////./pipe/docker_engine` respondeu normalmente, versão 24.0.6.
A imagem `postgres:17-alpine` já estava disponível, sem necessidade de pull.

Não houve reset, atualização, alteração de configuração, exclusão de volume
ou acesso a banco remoto. O volume existente
`aulas711_20261106_equipamentos_postgres` continuou presente; as fixtures usam
somente seus próprios containers novos e descartáveis.

Com Node 24.22.1 e pnpm 11.19.0, foram executadas duas rodadas seriais, mantendo
todos os testes habilitados:

```powershell
pnpm --package=pnpm@11.19.0 dlx pnpm test --maxWorkers=1 --no-file-parallelism
```

| Rodada local | Arquivos aprovados | Testes aprovados | Testes sem executar | Resultado                                    |
| ------------ | ------------------ | ---------------- | ------------------- | -------------------------------------------- |
| 23:36:24     | 6 de 7             | 48               | 7                   | exit 1; preparação HTTP excedeu 120 segundos |
| 23:41:32     | 6 de 7             | 48               | 7                   | exit 1; preparação HTTP excedeu 120 segundos |

Os 17 testes de autorização e os 11 de acesso passaram com PostgreSQL real.
Os sete testes de `src/server/auth/login-flow.test.ts` não chegaram às
asserções: o `beforeAll` excedeu o limite existente de 120.000 ms. Na segunda
rodada, o build chegou a gerar `.next/BUILD_ID`, mas isso não comprova que a
fixture ficou pronta nem substitui o resultado dos testes HTTP.

A memória livre estava abaixo de 200 MB durante o diagnóstico inicial e
oscilou em torno de 300–730 MB na repetição. O operador informou que liberaria
memória. Isso sugere pressão de recursos, sem comprovar a causa exclusiva do
timeout. Nenhum teste, timeout ou passo de build foi alterado para aprovar.

Uma leitura posterior de `Win32_PerfFormattedData_PerfOS_Memory` registrou
328 MB disponíveis, 26,1 GB de memória comprometida, 9,6 GB de pool não
paginável e 8.744 páginas lidas por segundo. Esse consumo do pool do kernel
merece diagnóstico separado; a leitura isolada não identifica driver nem
comprova vazamento. A [documentação da Microsoft](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/determining-whether-a-leak-exists)
orienta observar a evolução dos contadores para investigar vazamentos.
Não foram instaladas ferramentas, alterados drivers ou reiniciado o Windows.

Após o operador confirmar que terminou de liberar memória, nova leitura
mostrou 540–543 MB livres de 16.069 MB totais, com o pool não paginável ainda
em 9,6 GB. Não houve recuperação suficiente para justificar uma terceira
execução idêntica. Recomenda-se salvar o trabalho e reiniciar o Windows pelo
operador antes de retomar a suíte; isso não identifica nem corrige a causa
de um eventual consumo recorrente do pool.

Após as rodadas, a suíte técnica
`pwsh -NoProfile -File scripts/tests/verificador-runtime.test.ps1` passou com
17 casos e exit 0. O daemon respondeu e a consulta de containers com o label
`empresti.test=access` ficou vazia, confirmando a limpeza das fixtures.

Esta retomada não alterou código, dependências, schema, migrations ou produto.
Generate, lint, typecheck e build aprovados anteriormente permanecem como
evidência histórica; não foram reexecutados nesta tarefa operacional. A suíte
integral continua pendente, assim como os commits exigidos e a validação remota.
Não houve nova declaração de prontidão de spec, commit, push, tag ou deploy.

## Retomada de 11/11/2026 — suíte integral aprovada em cópia temporária

O operador pediu para continuar e depois reconectar/continuar. A execução em
andamento foi retomada, sem duplicar a suíte. O Windows havia sido reiniciado
pelo operador; a leitura inicial mostrou cerca de 2,5 GB livres e uma leitura
posterior registrou pool não paginável de aproximadamente 1,1 GB. A pressão
anterior de memória diminuiu, sem diagnóstico ou alteração de drivers.

O Docker Desktop existente foi iniciado oculto. Após a inicialização do WSL,
o endpoint local respondeu versão 24.0.6 e a imagem PostgreSQL existente foi
encontrada. Não houve pull, reset, mudança de configuração ou acesso remoto.
Os 17 casos de `scripts/tests/verificador-runtime.test.ps1` passaram novamente.

### Falha reproduzida no diretório original

A suíte iniciada às 00:04:23 terminou com exit 1: 48 testes passaram e os sete
de login não executaram por falha na preparação da fixture. Em seguida,
`pnpm --package=pnpm@11.19.0 dlx pnpm build` gerou o Prisma Client com sucesso,
mas o Next falhou com EPERM ao executar unlink em
`.next/static/xi0KJ2TPBzssAvmN5FZZn`.

A pasta tinha atributos ReadOnly, Directory, Archive e ReparsePoint. A leitura
do mesmo caminho pelo Node retornou:

| Consulta                                   | isDirectory | isSymbolicLink |
| ------------------------------------------ | ----------- | -------------- |
| fs.lstatSync                               | true        | false          |
| Dirent de fs.readdirSync com withFileTypes | false       | true           |

O código instalado em `next/dist/lib/recursive-delete.js` decide entre rmdir e
unlink usando Dirent.isDirectory. Essa divergência explica a operação unlink
contra o diretório. Não foi identificado processo Next ativo no repositório
durante a conferência. O cache original não foi apagado, renomeado ou movido;
nenhum atributo, ACL ou configuração do OneDrive foi alterado. O comando de
build no diretório original continua pendente de correção do ambiente.

### Escopo da cópia e execução

Criada uma cópia temporária fora do OneDrive, em
`C:/Users/dmitrikogake-ieg/AppData/Local/Temp/empresti-validacao-20261111-y3yqb2h7`.
Foram copiados somente src, prisma, public e sete arquivos de configuração:
package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.json,
postcss.config.mjs, eslint.config.mjs e next-env.d.ts, quando presentes.
O total efetivamente copiado foi de 53 arquivos. Não foram copiados .env,
documentos brutos da prática, Git ou credenciais.

node_modules foi ligado por uma junction à instalação já existente. Uma
primeira invocação do pnpm nessa cópia tentou sua verificação automática de
dependências e abortou por ausência de TTY antes da purga dos módulos. Não
foi forçada a remoção nem concluída uma instalação. Nas execuções seguintes,
o CLI pnpm 11.19.0 já em cache foi chamado diretamente pelo Node 24.22.1,
com `--config.verify-deps-before-run=false` somente na linha de comando.
Isso evita instalação automática na cópia que reutiliza node_modules; não
desabilita testes ou asserções e não persiste configuração no projeto.

A suíte manteve `test --maxWorkers=1 --no-file-parallelism`. Sua primeira
execução na cópia ainda excedeu o beforeAll de 120 segundos na compilação
inicial: 48 testes passaram e sete não executaram. O build foi então executado
separadamente com `node node_modules/next/dist/bin/next build --webpack` e
terminou com exit 0, incluindo TypeScript e as rotas existentes. Após o cache
ser preparado, a suíte integral foi repetida, incluindo novamente o build da
fixture; não foi usada a opção build=false nem alterado qualquer timeout.

| Verificação                                                 | Resultado                                               |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| Suíte integral iniciada às 00:15:59                         | exit 0; 55 testes em sete arquivos; nenhum ignorado     |
| Login HTTP com Next de produção, SDK SSR e PostgreSQL local | sete testes passaram; arquivo em 88,475 s               |
| Autorização e acesso com PostgreSQL real                    | 17 + 11 testes passaram                                 |
| Build separado na cópia                                     | exit 0; compilação, TypeScript, páginas e proxy gerados |
| Duração total da suíte aprovada                             | 155,19 s                                                |
| Suíte técnica do verificador no repositório original        | exit 0; 17 casos                                        |
| Containers com label empresti.test=access após a suíte      | nenhum restante                                         |
| Volume original aulas711_20261106_equipamentos_postgres     | continua presente                                       |

Os hashes SHA-256 dos 53 arquivos foram comparados na origem e na cópia antes
e depois da execução: nenhum arquivo divergiu. O manifesto temporário
`verificacao-snapshot.json` tem SHA-256
`c88b261d1aa9b5106a0c06fd553442e9e0bf37ec50eb38c4a74ea84aaa25b594`.
O manifesto é um recibo local, não um novo parecer independente de prontidão.

### Limites e próximo passo

Esta rodada valida o snapshot de código fora da pasta sincronizada. Não prova
que o comando no diretório original passou: ali o EPERM permanece. A cópia
temporária e os artefatos gerados não integram o pacote de entrega. Lint e
typecheck completos do repositório mantêm os resultados históricos; não foram
reexecutados nesta tarefa operacional. A etapa 1 ainda depende do uso estável
do ambiente original, dos commits exigidos e da validação remota.

Somente este registro, o plano, ENTREGA.md e handoff.md foram atualizados no
repositório. Não houve mudança de fonte, teste, timeout, dependência declarada,
schema, migration, produto, ADR ou repositório alheio. Não houve commit, push,
tag, deploy, escrita em Supabase/Storage ou novo parecer independente da spec.
O próximo trabalho proposto é a definição da skill Pixabay, com decisões e
aprovações próprias antes da implementação. Corrigir o uso diário da pasta
sincronizada não deve apagar dados nem mover a árvore atual sem autorização.
