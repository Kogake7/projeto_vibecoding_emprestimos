# Execução isolada do verificador

O papel canônico é [agents/verificador-spec.md](../agents/verificador-spec.md).
O gatilho obrigatório fica em [rules/spec-flow.md](../rules/spec-flow.md):
encerramento da última tarefa ou pedido de prontidão exige conferência antes
da resposta. Uma rodada incompleta ou `NÃO PRONTA` não libera a spec.

## Por que uma sessão separada

Os subagentes nativos herdam as permissões do principal; instruções do papel
não criam um sandbox próprio, conforme a [documentação oficial](https://learn.chatgpt.com/docs/agent-configuration/subagents).
Por isso o projeto usa a alternativa de sessão limpa prevista no `AGENTS.md`.
O principal lança o verificador pelo CLI em sessão nova, sem histórico,
`read-only`, aprovação `never`, com shell, apps, plugins e MCP Supabase
desativados. O [runtime compartilhado](../scripts/verificador-runtime.ps1)
também desativa host de ferramentas, navegador, uso do computador, geração de
imagem, hooks e delegação; isso não significa que todo nome de ferramenta
desapareça do schema exposto pelo CLI.
Não modificar o perfil da sessão principal nem supor que um subagente com
acesso de escrita esteja tecnicamente isolado.

Esse executor abre uma sessão independente assumindo o papel; não registra
um subagente nativo em `.codex/agents/`. A adequação dessa adaptação ao requisito
da prática e a prova do gatilho obrigatório precisam ficar explícitas na entrega.

## Executar

O principal primeiro lê os testes e suas dependências e confirma que são
locais. O parâmetro `LocalTestsReviewed` registra essa revisão; não é uma
detecção automática de destino remoto. Não usar esse parâmetro sem conferir.

Exemplo PowerShell, da raiz, para a interface existente:

```powershell
./scripts/verificar-spec.ps1 `
  -Spec 'docs/specs/001-login/spec.md' `
  -ScopeFiles @('src/components/login-screen.tsx','src/app/page.tsx','src/app/login/page.tsx') `
  -TestFiles @('src/components/login-screen.test.tsx') `
  -Round 'identificador-novo' `
  -LocalTestsReviewed
```

O escopo desse exemplo comprova a interface, não a autenticação completa.
Para uma spec inteira, fornecer todas as fontes e testes relevantes; fonte
ausente nunca vira aprovação. Não repetir identificador: relatórios anteriores
não são sobrescritos. Não usar `pnpm test -- <arquivo>` neste ambiente: o
separador fez a suíte inteira executar; `pnpm test <arquivo>` filtrou corretamente.

Desde a revisão de 10/11, exit 0 exige CLI/testes com sucesso, fontes preservadas,
um único `Veredito: PRONTA` e exatamente uma linha ATENDIDO com evidência para
cada CA da spec, sem CAs extras. A spec deve declarar seus critérios em itens
`- CA-01 — descrição`. Falta de prova, formato inválido ou parecer NÃO PRONTA
gera erro depois de preservar os relatórios; falhas do CLI/fontes também recusam.
O exemplo parcial acima normalmente termina em erro porque não cobre toda a
spec de login. As rodadas antigas mantêm a semântica antiga de exit 0.

O principal ainda confere a qualidade da evidência e o escopo: o parser não
decide se o teste comprova o negócio. PRD/ADRs relevantes precisam ser incluídos
quando necessários; o snapshot não descobre arquivos omitidos. Aprovação local
não prova CI, Preview ou funcionamento remoto.

O gatilho de chamar o verificador continua obrigatório nas instruções do fluxo.
Não foi instalado hook global nem bloqueio de toda resposta de conversa. O
controle por código aplica-se ao resultado do executor depois de chamado.

## Recibo de checks e anexos visuais

Desde 11/11, ScopeFiles também aceita JSON, Python, PowerShell e MJS, além
dos formatos anteriores. Isso fornece código e manifestos como texto; não
os executa. Mantêm-se os limites de tamanho, caminhos explícitos e bloqueios
de credenciais, arquivos externos, links simbólicos e junctions. Placeholders
reais do OneDrive continuam permitidos, como no executor anterior.

LocalChecksReceipt é opcional: aponta para um JSON em docs/evidencias com
testExit numérico zero, testOutput, testFiles, sourceHashes, command, node,
pnpm, completedAtUtc em UTC com Z e workingDirectory absoluto existente.
Exige Node 24 e pnpm 11.19.0, todos os testes solicitados e SHA-256 coincidente
para cada fonte do snapshot, inclusive AGENTS, papel, regras, spec, plano,
tarefas e imagens fornecidas. O recibo não substitui esses arquivos. São
recusados hashes divergentes, campos inválidos e padrões de credenciais na
saída. O recibo tem limite de 2 MiB e sua saída, 1 MiB.

Com recibo válido, o executor reaproveita os testes locais executados pelo
principal na cópia de trabalho declarada, sem tentar executá-los novamente
no diretório com cache bloqueado pelo OneDrive. O prompt informa essa origem;
metadados preservam caminho/hash do recibo, comando, versões e horário. É um
atestado do principal com consistência conferida, não prova independente de
que um processo realmente executou o comando. Sem recibo, o comportamento de
executar pnpm test com os arquivos solicitados permanece.

Recibos com evidenceOrigin=github-actions acrescentam evidenceUrl HTTPS do
run no GitHub, runId numérico e commit de 40 dígitos hexadecimais. Nesse caso,
workingDirectory registra o caminho POSIX real do runner, sem exigir pasta
fictícia no Windows. O principal autentica a obtenção do log e confere blobs
do commit contra os fontes atuais; o executor valida a estrutura e os hashes,
sem se apresentar como quem executou ou autenticou o CI. O prompt e os
metadados distinguem explicitamente essa origem e documentos novos de leitura.
Cinco regressões puras cobrem a proveniência CI e suas recusas.

ImageFiles é opcional e explícito: JPG/JPEG/PNG em public/equipment, até 5 MiB
por arquivo e com assinatura correspondente. As imagens são anexadas usando
codex exec --image, conforme ajuda do CLI instalado. O snapshot textual contém
nome, tamanho e SHA-256; nunca lê o binário como linhas. O verificador deve
examinar os anexos reais; hash não comprova revisão visual. Nenhuma ferramenta
de shell, navegador, escrita ou geração de imagem é habilitada para isso.

Após a sessão, fontes, imagens e recibo são novamente conferidos. Mudança
invalida a rodada. O gate original de testes/CLI/fontes/veredito/tabela de CAs
continua obrigatório; recibo e fotos não produzem aprovação por conta própria.

## Responsabilidades e evidências

- Principal: revisa destino, executa os testes explícitos, captura fontes
  numeradas e hashes e inicia o CLI. Ele é quem pode corrigir os achados.
- Verificador: recebe a spec, plano, tarefas, rules e fontes por snapshot,
  avalia cada CA e devolve a tabela. Não alega ter executado os checks do principal.
- O principal salva `.md` com a resposta, `.json` com hashes/checks/versões e
  `.jsonl` com os eventos retornados pelo CLI em `docs/evidencias/`.
- A sessão do verificador não recebe a conversa nem relatórios de rodadas
  anteriores. As fontes são necessárias para verificar intenção e implementação;
  o resultado do principal sozinho não substitui o código e o teste.
- O script rejeita fontes fora da raiz, segredos pelo caminho, links reais,
  testes fora de `src` e snapshots grandes. Não fornece `.env` ao modelo.
- O CLI lê sua autenticação existente internamente; não copiar tokens para
  script, argumentos, fontes ou relatórios. Não instala dependências.
- O processo do CLI recebe ambiente mínimo por lista explícita no runtime,
  usando PowerShell 7 já disponível. Variáveis de banco, aplicação e provedores
  não são encaminhadas. HOME/USERPROFILE/CODEX_HOME existentes servem à
  inicialização e à autenticação interna do cliente; seus valores não entram
  nos metadados. Isso não revoga a autenticação do próprio CLI nem cria uma
  garantia geral de bloqueio de leitura de arquivos da máquina.
- O principal preserva stdout em JSONL e stderr separado; registra apenas
  os nomes das variáveis encaminhadas. Não usa shell para iniciar o CLI,
  preserva argumentos e UTF-8 e encerra o processo em caso de timeout.

O isolamento foi provado neste ambiente; alterações futuras de config/MCP,
plugins, ferramentas ou versão do CLI exigem nova inspeção das capacidades.
O script desativa o MCP declarado atualmente no projeto e ignora a configuração
pessoal. Ele não deve ser descrito como isolamento universal de qualquer harness.

A documentação oficial confirma a diferença entre
[permissões herdadas por subagentes](https://learn.chatgpt.com/docs/agent-configuration/subagents)
e [sandbox/aprovação da sessão](https://learn.chatgpt.com/docs/agent-approvals-security).
O [CLI](https://learn.chatgpt.com/docs/cli/reference) documenta sessões efêmeras
e configuração pessoal ignorada; autenticação do próprio CLI continua interna.

## Reproduzir as provas locais

```powershell
./scripts/tests/verificador-runtime.test.ps1
./scripts/testar-isolamento-verificador.ps1 -Round 'identificador-novo'
pnpm --package=pnpm@11.19.0 dlx pnpm exec pwsh -NoProfile -File scripts/provar-verificador.ps1 -Round 'outro-identificador'
```

Os 17 testes técnicos originais não usam Codex, rede ou banco. Além do parser, exercitam
o filtro de ambiente, um processo PowerShell local com variável sentinela,
transporte UTF-8/erros/código de saída e encerramento por timeout. Em 11/11,
foram adicionados 38 testes de fontes, recibos e imagens, executados também
pelo mesmo comando: aceitação válida e recusa de caminhos, links, tamanhos,
tipos, versões, saída sensível, hashes divergentes e recibos incompletos.
A mesma suíte
foi incluída no workflow de CI existente, com `shell: pwsh`, sem instalar módulo
ou mudar versões. A configuração local não comprova execução no GitHub.
PowerShell nos runners é descrito na
[documentação oficial do GitHub](https://docs.github.com/en/actions/tutorials/build-and-test-code/powershell).
A prova de
isolamento usa o runtime compartilhado e exige um canário inexistente. A prova
de erro executa somente os testes locais da tela, insere um link público de
cadastro temporário e restaura o componente byte a byte, preservando o teste.
Não cria commits. Recusa restauração sobre edição concorrente inesperada.

Na configuração atual, o teste de escrita é rejeitado pelo host de ferramentas
desativado antes de apply_patch executar. Os eventos/erros brutos e a ausência
do arquivo comprovam esse bloqueio; não são nova prova do sandbox de arquivos.
Nomes de colaboração ainda podem aparecer no schema; sua presença não equivale
a permissão de escrita ou a conector de produção. Não habilitar capacidades
para contornar a rejeição observada. O script recusa uma prova sem o erro bruto
esperado ou com o arquivo criado. Cada rodada preserva seus próprios registros.

## Limites e entrega

Os testes rodam pelo principal e podem escrever caches técnicos. O verificador
fica em `read-only` e não publica nem acessa o banco do deploy. Testes de banco
futuros ainda exigem PostgreSQL local e autorização de destino conhecido.

O papel cobre o monolito: fontes de tela, procedure, service e persistência
devem entrar no escopo quando a spec atravessar essas camadas. O exemplo atual
não implementa essas partes ausentes do login.

A [prova de 09/11](evidencias/verificador-2026-11-09.md) registra as três rodadas,
o erro plantado, a restauração e o bloqueio de escrita. Não substitui as tabelas
finais das duas specs futuras nem os dois commits exigidos pelo enunciado.
