# Avaliação da prática SDD e subagentes

Data: 09/11/2026. Escopo inicial: entender o enunciado, confrontar as fontes e levantar decisões. Depois, o operador autorizou a primeira etapa do verificador. Esta segunda revisão não implementa novas funcionalidades nem aprova specs.

## Objetivo

A prática avalia a capacidade do operador de reconhecer conflitos e lacunas,
decidir com alternativas e motivos e manter rastreabilidade entre decisão,
spec, plano, tarefas, implementação, testes e evidência de produção.
O `ENTREGA.md` é central: código funcionando sozinho não demonstra esse objetivo.

Fonte: [enunciado](../pratica-sdd-subagentes/pratica-sdd-subagentes.html),
seções 00, 01 e 06. A cópia em `aulas/` tem o mesmo SHA-256 nesta avaliação.

As cinco entregas, na ordem, são: verificador; skill `imagens-equipamentos`;
spec de dados iniciais com 12 equipamentos e conta do professor;
spec de solicitação imediata de empréstimo; `ENTREGA.md` com evidências.
A avaliação final também exige produção e tag, mas este pedido de análise não autoriza publicação, commit, push ou tag.

## Conflitos e pegadinhas

| Pedido ou pressuposto                                        | Fonte que precisa ser respeitada                                                                | Tratamento da avaliação                                                                                                                                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Limite de 5 empréstimos                                      | [PRD](PRD.md), regra de máximo de 3                                                             | O briefing não autoriza trocar o limite do PRD. Preservar 3 e registrar o conflito.                                                                                                                               |
| Prazo de 14 dias úteis                                       | PRD anterior fixava 14 dias sem qualificar; decisão final do operador incorporada ao PRD        | Operador revisou a regra e autorizou atualizar o PRD: 14 dias úteis, sem fins de semana e feriados nacionais brasileiros, no mesmo horário.                                                                       |
| TI-0010 disponível no briefing, em manutenção na lista exata | O próprio enunciado diverge entre seções 03 e 04                                                | Conferência das aulas anteriores concluída; seguir a lista exata conforme orientação do operador: 3 em manutenção e 9 disponíveis.                                                                                |
| Verificador corrigir teste quebrado                          | Seção 02, independência; [papel](../agents/verificador-spec.md); [fluxo](../rules/spec-flow.md) | Reprovar e devolver ao principal. O pedido do tech lead contradiz o contrato.                                                                                                                                     |
| Catálogo sem texto de crédito                                | Contrato da skill, seção 03                                                                     | Manter o crédito com link; o pedido visual não elimina a obrigação.                                                                                                                                               |
| Senha literal no arquivo de população                        | Seção 01; [restrições](../rules/restrictions.md); [segredos](../rules/secrets.md)               | Não incorporar a senha no seed, documentação derivada, logs ou histórico. O próprio HTML do exercício contém a senha; não versionar o material bruto sem tratar esse conteúdo.                                    |
| Instalar `sharp` como passo automático                       | [Operação](../rules/operacao.md), instalação exige pedido prévio                                | Não é biblioteca nominalmente proibida pelo ADR. É uma escolha que exige justificativa e autorização. Existe no lockfile transitivamente pelo Next; isso não equivale a dependência direta aprovada para scripts. |
| Agente popular banco ou enviar imagens ao deploy             | Seções 01 e 03 reservam escritas ao operador                                                    | Preparar e validar localmente; operação de escrita no banco/Storage do deploy é humana nesta prática.                                                                                                             |
| Apenas escrever que o verificador não pode publicar          | Seção 02 exige que ele não consiga                                                              | Instrução textual não comprova restrição de ferramentas, credenciais e ambiente. Exigir evidência do harness.                                                                                                     |
| Imagens visualmente do mesmo tamanho                         | Seção 03 exige arquivos 800×600                                                                 | Medir os arquivos finais. CSS e parâmetro de busca não são prova da dimensão.                                                                                                                                     |
| Reexecutar seed para restaurar os dados da lista             | [Migration](../rules/migration.md) protege dados existentes                                     | Idempotência não pode reabrir equipamento emprestado, apagar empréstimo ou redefinir indevidamente conta existente. Especificar comportamento em reexecução.                                                      |
| Login já estaria pronto                                      | [Spec 001](specs/001-login/spec.md) e [tarefas](specs/001-login/tasks.md)                       | Pressuposto não atendido pelo código local; não tratar tela de login como autenticação funcional.                                                                                                                 |

O crédito do Pexels foi confirmado nas [diretrizes oficiais da API](https://www.pexels.com/api/documentation/).
Os tamanhos predefinidos retornados pela API também não são todos 800×600;
a saída final precisa de validação própria. O contrato da prática continua
exigindo revisão visual de pessoas, marcas, textos e telas, registro de autor,
origem e licença e ausência de repetição da mesma foto entre equipamentos.

Um [bucket público do Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)
permite leitura pública; as demais operações continuam sujeitas a controle.
Portanto, público não deve significar upload público.

## Estado local encontrado

- `src/components/login-screen.tsx`: envio real via tRPC, validação compartilhada, POST nativo e estados de erro/loading. Spec 001 pronta com provas locais: 55 testes Vitest, quatro de navegador e parecer independente PRONTA para onze CAs. Validação remota pendente.
- `src/server/services/loan-policy.ts`: usa limite 3 e ainda soma 14 períodos de 24 horas. Após a decisão final de 14 dias úteis, esse cálculo ficou divergente do PRD; adequá-lo e testar o calendário na futura spec de solicitação, sem antecipar essa implementação na etapa do verificador.
- `prisma/seed.ts`: cria apenas o tenant `suporte_ti`; não provisiona os 12 itens ou a conta.
- `prisma/schema.prisma`: `Equipment` não tem imagem/créditos. Será necessário decidir persistência antes de propor DDL; não gerar migration nesta avaliação.
- `prisma/migrations/20260914110100_constraints/migration.sql`: índice único impede dois empréstimos abertos do mesmo equipamento. Isso sozinho não demonstra atomicidade do fluxo nem protege o limite do usuário em solicitações concorrentes de equipamentos diferentes.
- `agents/verificador-spec.md`: papel, tabela comparável e proibição de corrigir já existiam. Após a autorização da primeira etapa, foi acrescentada execução reproduzível em sessão limpa e somente leitura; provas em [verificador de 09/11](evidencias/verificador-2026-11-09.md). Versionamento e demais provas específicas do verificador ainda pendentes; validação local de T-04 já repetida com pnpm 11.19.0.
- `skills/`: existe skill de revisão de interface; não existe `imagens-equipamentos`.
- `docs/specs/`: existe `001-login`; não existem as duas specs desta prática. Não sobrescrever login por interpretar literalmente “duas primeiras specs”.
- Há alterações anteriores sem commit e arquivos não rastreados. Esta análise não os remove, não os incorpora em commit e não retoma automaticamente a tarefa antiga das aulas 7–11.

Não foram consultados o banco remoto nem o deploy. Estado local não prova estado de produção.
Os relatos de 06/11 são históricos; não substituem novas tabelas das duas specs,
nem a prova de erro plantado com os dois commits exigidos pelo enunciado.

## Respostas do operador e conferência das fontes

Em 09/11/2026, o operador orientou seguir a lista exata se TI-0010 pertencer
ao exercício e revisar/desfazer alterações se sua inclusão tiver sido indevida.
O item está explicitamente na seção 03 do enunciado como `Cabo de rede 3 m`,
um dos três cabos que completam os 12 equipamentos. As aulas 7–11 não trazem
outro inventário fixo. A mesma busca foi feita nos arquivos dessas aulas, PRD
e seed dentro de `entrega-inicial/projeto.zip`, sem extrair ou alterar o ZIP.
Não apareceu TI-0010 nem inventário incompatível nesses arquivos anteriores;
o seed atual cria apenas o tenant, assim como o seed da entrega inicial.

Conclusão: manter os 12 da lista exata, com TI-0004, TI-0007 e TI-0010 em
manutenção e os outros 9 disponíveis. Não foi identificada mudança de código
para reverter por causa da presença do TI-0010. Isso não afirma o estado do
banco remoto, que não foi consultado.

O operador revisou expressamente a decisão anterior de dias corridos:
o prazo final é de **14 dias úteis, excluindo sábados, domingos e feriados
nacionais brasileiros, com vencimento no mesmo horário da solicitação**.
O fuso confirmado é **America/Sao_Paulo**. O próprio dia da solicitação conta
como dia 1 quando útil; caso contrário, o dia 1 é o próximo dia útil. Essa
resposta substitui a proposta de começar sempre no dia útil posterior.
O [PRD](PRD.md) foi atualizado com essa autorização. A futura spec deve
incorporar o calendário e os casos de borda antes de derivar plano, tarefas,
testes e código; este registro de análise não substitui a aprovação da spec.

Quanto à conta do professor, a decisão final expressa do operador é usar
**uma única conta**, `marcelo.grilo@institutojef.org.br`, com papel `ADMIN`
no tenant `suporte_ti` e acesso às duas visões: administrador e colaborador.
Isso inclui acesso às páginas e aos serviços de colaborador, como catálogo,
solicitação e consulta dos próprios empréstimos. As regras de empréstimo e
o isolamento por tenant continuam valendo para essa conta.
Essa decisão substitui a escolha anterior de papéis separados e duas contas;
não há segundo e-mail pendente.

O [layout](layout.md), seção 7, sugere as duas áreas no mesmo app, mas uma
referência visual não determina permissões. O [ADR-003](adr/003-layout-empresti.md)
aprova apenas a tela inicial/login; o encadeamento de middlewares do ADR-001
também não define, sozinho, a matriz de acesso de cada funcionalidade.

A permissão cumulativa agora decorre da decisão expressa do operador,
não de uma interpretação do layout. Incorporá-la nas specs pertinentes e
testar o acesso de ADMIN às funções de colaborador, além de impedir acesso
administrativo ao colaborador. O provisionamento da conta e a atribuição
real do papel no deploy serão executados pelo operador, seguindo o limite
da prática. Nenhuma conta ou permissão real foi alterada nesta avaliação.

## Outras decisões necessárias antes das specs

A seleção de membership foi resolvida pelo operador: somente suporte_ti, com
vínculo existente. A spec 001 e o plano foram revisados para aprovação antes do
código. Para as specs futuras, explicitar comportamento se a conta ou os itens
já existirem; caminho de navegação e feedback de erro; política de seleção,
corte e reprovação de fotos; reação a duplo clique/reenvio; precedência de
recusas simultâneas. Cada lacuna de comportamento depende do operador;
não transformar a implementação atual em decisão aprovada.

Preservar a conta do professor com zero empréstimos e testar com uma
conta própria do aluno.
Não apagar histórico para simular esse requisito. Catálogo estar fora da spec
de dados e dentro da de solicitação é separação de escopo, não contradição.
A criação imediata do empréstimo, sem aprovação ou fila, é explícita no briefing.
Devolução e painel de Operações pertencem ao MVP do PRD, mas estão fora desta fatia da prática.

## Validação e próximo passo

Avaliação inicial por leitura do enunciado completo, PRD, ADR-001, rules, spec
existente, papel do verificador, código relacionado e documentação oficial.
Hashes das duas cópias do HTML comparados. Na avaliação inicial, não foram
executados testes funcionais ou checks de aplicação. As execuções posteriores,
autorizadas na primeira etapa, estão descritas abaixo e nas evidências; não
confundir esses momentos nem declarar prontidão do login.

Nesta complementação, as buscas nas aulas 7–11 e no ZIP da entrega inicial
confirmaram a origem do inventário; não houve mudança funcional nem reversão.

## Primeira etapa autorizada e executada

O operador pediu iniciar a conferência do verificador. Foram acrescentados o
[executor isolado](../scripts/verificar-spec.ps1), o [procedimento](verificador-spec.md)
e o gatilho obrigatório nas rules, sem implementar funcionalidades posteriores.
O modo usa sessão CLI nova, `read-only`, sem shell/apps/plugins e com MCP de
banco desativado; o principal fornece fontes numeradas, hashes e checks locais
que ele revisou e executou. Subagente nativo com escrita herdada não foi usado
como prova de bloqueio técnico.

A prova real de `apply_patch` foi bloqueada pelo sandbox; três rodadas do mesmo
escopo mostraram CA-08 ATENDIDO, REPROVADO com erro plantado e ATENDIDO após
restauração byte a byte. Os relatórios mantiveram login NÃO PRONTA, e o teste
original não foi alterado. Ver [evidências](evidencias/verificador-2026-11-09.md).

Os checks iniciais da primeira etapa usaram pnpm 11.25.0, diferente do adotado
11.19.0. Posteriormente o operador autorizou a versão temporária e os checks
de T-04 foram repetidos com sucesso em 11.19.0, conforme as evidências próprias.
Isso não cria os dois commits exigidos pela prova histórica do verificador,
que continuam dependendo de autorização; não fabricar esse histórico.

Próximo passo: resolver as pendências de ambiente/versionamento da primeira
etapa; para iniciar login depois, delimitar a tarefa e aprovar a spec/plano.

## Segunda revisão: decisões finais e decisões substituídas

| Assunto                      | Regra vigente                                                                                                                           | Origem e situação                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Prazo                        | 14 dias úteis, sem fins de semana e feriados nacionais brasileiros; mesmo horário em America/Sao_Paulo; solicitação é dia 1 quando útil | Decisão final expressa do operador, incorporada ao PRD. Substitui dias corridos. Código ainda divergente.                      |
| Equipamentos                 | Exatamente os 12 da lista: 4 notebooks, 3 monitores, 3 cabos e 2 câmeras                                                                | Operador mandou seguir a lista após conferir sua origem; TI-0010 é legítimo.                                                   |
| Manutenção                   | TI-0004, TI-0007 e TI-0010; os outros 9 disponíveis no estado inicial                                                                   | Decisão do operador resolve a contradição lista/briefing. Não reimpor esse estado a itens já emprestados em reexecução.        |
| Conta do professor           | Somente `marcelo.grilo@institutojef.org.br`, ADMIN em suporte_ti, com páginas e serviços das duas visões                                | Decisão final expressa. Substitui duas contas e elimina a pendência de segundo e-mail. Ainda não provisionada por esta tarefa. |
| Limite                       | 3 empréstimos em aberto                                                                                                                 | Regra do PRD preservada; o pedido de 5 não a substituiu. Nenhuma exceção de limite para ADMIN foi aprovada.                    |
| Criação do empréstimo        | Imediata, sem aprovação de Operações ou fila                                                                                            | Decisão explícita do enunciado, ainda a incorporar na spec de solicitação.                                                     |
| Conta intacta                | Professor chega à correção com zero empréstimos; testes usam conta própria do aluno                                                     | Obrigação do enunciado, não apagar histórico para simular cumprimento.                                                         |
| Publicação e dados do deploy | Principal prepara localmente; operador faz as escritas de banco/Storage                                                                 | Obrigação específica desta prática. Pedido de revisar não autoriza instalar, commitar ou publicar.                             |

As menções a dias corridos e duas contas acima são histórico de substituição
ou descrição do código divergente; não são regras ativas. Os relatórios brutos
das rodadas antigas não devem ser reescritos para aparentar decisões posteriores.

## Pegadinhas adicionais conferidas nesta revisão

| Ponto                                              | Tratamento correto / evidência necessária                                                                                                                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nomes repetidos de equipamento                     | TI-0002 e TI-0004 se chamam Notebook 15 polegadas e são unidades diferentes. Não deduplicar por nome. Preservar todos os patrimônios.                                                                                         |
| Manutenção escondida no catálogo                   | O enunciado exige os 12 visíveis com situação. PRD proíbe tratá-los como disponíveis, não exige escondê-los. A nota de `docs/layout.md:345` que os esconde não governa a regra de negócio.                                    |
| Aplicar o ADR-003 a todas as telas                 | Seu escopo aprovado é somente `/` e `/login`. Para catálogo e demais telas, conferir ADR-002 e esclarecer a direção visual; não ampliar ou alterar ADR existente por inferência.                                              |
| Fotos antigas e fontes alternativas                | Todas as fotos de equipamentos vêm da skill/Pexels. Não substituir por outra plataforma ou imagens geradas. Landing, logo e ilustrações não entram automaticamente nessa troca.                                               |
| Busca de imagem considerada aprovação              | Termos como laptop/monitor não garantem ausência de pessoa, marca, texto ou tela com conteúdo. Revisão visual e registro real das rejeições continuam necessários.                                                            |
| Tamanho e repetição só aparentes                   | Validar dimensões dos arquivos finais e identificação das fotos. CSS, nomes diferentes ou recortes da mesma foto não demonstram unicidade.                                                                                    |
| Bucket público entendido como escrita pública      | A leitura das fotos é pública. Upload, substituição e exclusão precisam continuar protegidos; não fornecer credenciais de produção ao agente para preparar imagens.                                                           |
| Créditos apenas no relatório                       | Além da origem, fotógrafo e licença por imagem, a tela precisa mostrar Fotos: Pexels com link. O briefing visual não elimina essa exigência.                                                                                  |
| Seed reiniciável confundido com reset              | Reexecução não duplica registros/objetos, não recria a conta indevidamente, não redefine empréstimos, senha ou status operacional sem decisão. Comparar duas execuções em teste real.                                         |
| Usuário de Auth confundido com membership          | Criar uma identidade no Supabase Auth não concede automaticamente tenant e papel na aplicação. Provisionamento deve contemplar ambos, sem tabela própria de senha.                                                            |
| Unicidade do item confundida com limite do usuário | O índice de um empréstimo aberto por equipamento ajuda na corrida do mesmo item. Duas solicitações do mesmo usuário a itens diferentes também precisam respeitar o limite de 3 atomicamente.                                  |
| Botão desabilitado considerado autorização         | Servidor deve validar sessão, tenant, papel, disponibilidade, atraso e limite. Persistência, status do item e auditoria precisam permanecer consistentes em sucesso/falha.                                                    |
| ADMIN visto como bypass geral                      | Acesso às funções de colaborador não dispensa regras de empréstimo ou isolamento. Meus empréstimos mostra os próprios; a visão administrativa tem seu escopo próprio.                                                         |
| SQL direto/MCP para acelerar                       | Prisma Migrate continua único dono do schema. DDL precisa de proposta/autorização; MCP de consulta não autoriza migrations ou escrita. O plugin disponível pode ter ferramentas diferentes do servidor read-only configurado. |
| Testar na Vercel considerado só leitura            | Solicitar empréstimo no link publicado escreve dados. As provas de produção que escrevem serão executadas pelo operador com sua conta de teste, preservando a conta do professor.                                             |
| Dados iniciais deveriam incluir catálogo           | A UI está fora da spec de dados e dentro da de solicitação; isso é divisão de escopo. Nenhum empréstimo é criado na população inicial.                                                                                        |
| Implementar tudo do PRD nesta prática              | Devolução e painel de Operações pertencem ao MVP amplo, mas estão fora desta fatia. ADMIN com duas visões não significa que todo o painel já foi implementado ou autorizado agora.                                            |
| Transformar toda decisão em ADR                    | A entrega exige discutir se uma decisão merece ADR, não criar um artificialmente. ADR existente só muda com autorização específica.                                                                                           |
| Decisão só no ENTREGA.md                           | Também precisa estar na spec correspondente, antes dos artefatos derivados e do código. O relatório de avaliação não substitui as duas specs ainda ausentes.                                                                  |
| Preencher histórico de decisões da IA              | A seção sobre suposição do agente exige episódio real. Não inventar conversa, aprovação, alternativa escolhida, foto reprovada, rodada ou commit.                                                                             |
| Tag de entrega e commits posteriores               | A tag entrega-pratica identifica o que será corrigido; mudanças posteriores ficam fora desse recorte. Commit, tag publicada, push e deploy continuam sujeitos à autorização própria. Monolito tem um repositório.             |

## Limites encontrados na nossa primeira etapa

1. **Sessão isolada não é registro nativo de subagente.** O script chama
   `codex exec` em contexto novo e assume o papel canônico. O subagente nativo
   foi usado na primeira conferência e na provocação de correção, mas herdou
   permissões de escrita. A prova segura usa a alternativa de sessão limpa
   permitida pelo AGENTS. Não afirmar que foi registrado um agente nativo em
   `.codex/agents/` ou que se provou um subagente nativo somente leitura.
   O enunciado pede subagente no harness: a adequação dessa adaptação precisa
   ficar explícita na entrega, sem tratar os dois mecanismos como idênticos.
2. **Gatilho prescrito, prova de acionamento ainda limitada.** A obrigação está
   no AGENTS e na rule, e o executor existe. As três rodadas foram disparadas
   explicitamente pelo principal; elas não demonstram, sozinhas, acionamento
   espontâneo ao terminar uma tarefa ou receber uma pergunta natural de prontidão.
   Isso pede prova do gatilho existente, não uma obrigação inventada de criar CI.
3. **Snapshot depende do escopo selecionado pelo principal.** Nas três rodadas,
   foram fornecidos papel, rules, spec/plano/tarefas e os arquivos de interface.
   Não foram fornecidos PRD e ADRs completos, nem código de servidor inexistente.
   Não há descoberta independente do restante do repositório nesse modo sem shell.
   O teste de CA-08 não aprova a implementação inteira, stack ou produção.
4. **Exit 0 não significa PRONTA.** O script verifica que o CLI concluiu e criou
   relatório; não interpreta automaticamente o veredito ou a tabela de todos os
   CAs. A rodada plantada teve CLI exit 0 e teste exit 1. Não usar o exit do
   executor como selo de aprovação ou bloqueio automático de integração.
5. **Ambiguidade ainda existe nos CAs de membership.** A conferência nativa
   apontou CA-05/07 como AMBÍGUO; as rodadas CLI usaram SEM TESTE e mencionaram
   a lacuna. Antes de comparar aprovações finais, explicitar a precedência desses
   estados, sem ocultar que ambos apontam evidência insuficiente e NÃO PRONTA.
6. **Bloqueio provado tem alcance específico.** A tentativa de `apply_patch`
   foi rejeitada na sessão read-only. Não foram tentadas operações reais de
   deploy, migration ou escrita remota para provar segurança; isso seria inadequado.
   A ausência de shell/apps/plugins e o MCP desativado complementam o sandbox.
   Novas ferramentas/configuração exigem nova conferência de capacidades.
7. **Histórico e provas específicas ainda incompletos.** As rodadas originais
   do verificador usaram pnpm 11.25.0. A autorização posterior permitiu preparar
   pnpm 11.19.0 e validar T-04, sem reescrever essas rodadas antigas. Os dois
   commits de plantio/restauração exigidos ainda não existem; hashes demonstram
   restauração local, não substituem evidência histórica.

Esses limites não anulam a reprovação real do erro plantado nem o bloqueio
observado. Impedem declarar a entrega 1 integralmente fechada com as provas atuais.

## Lacunas remanescentes, sem decisão inventada

- Prazo: fuso e dia inicial confirmados pelo operador: America/Sao_Paulo,
  incluindo o dia da solicitação quando útil; caso contrário, próximo dia útil.
  Definir a fonte e cobertura anual do calendário nacional antes da implementação; não presumir
  que qualquer calendário de pontos facultativos seja o de feriados escolhido.
- Login: decisão posterior do operador resolveu o vínculo: somente suporte_ti
  neste MVP, exigindo Membership existente. Spec/plano aprovados e serviço
  T-04/T-05 e fluxo de login/sessão T-02/T-03 implementados; conferência final
  independente aprovada localmente, com validação remota ainda pendente.
- Dados existentes: definir reexecução diante de itens/conta já presentes e
  mudanças manuais, sem sobrescrever o estado operacional por conveniência.
- Solicitação: fechar resposta a reenvio/duplo clique, precedência de recusas
  simultâneas e navegação/feedback. Transações e testes devem refletir as decisões.
- Interface: esclarecer o uso do visual nas novas telas diante do escopo
  limitado do ADR-003. Não alterar o ADR nesta revisão.
- Imagens: a skill ainda não existe; modo de processamento, revisão visual,
  critérios de crop e ferramentas permitidas serão preparados na etapa própria.
- Entrega: `ENTREGA.md`, as duas specs e suas tabelas finais ainda não existem.
  Decisões estão no PRD e neste registro, aguardando os artefatos de SDD.

Nesta segunda revisão foram relidos enunciado, decisões, scripts, fontes e
metadados reais; hashes das duas cópias do enunciado e da restauração conferidos.
Nenhuma nova prova funcional, instalação, commit, migration ou publicação foi
executada. Não recontar os checks da etapa anterior como execução desta revisão.

## Correspondência com as entregas do arquivo da prática

| Ordem do enunciado            | Situação real                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Subagente verificador      | Parcial: papel, execução em sessão limpa e provas locais existem; integração nativa/adaptação, gatilho, validação do veredito, pnpm adotado e histórico de commits têm ressalvas descritas acima. |
| 2. Skill imagens-equipamentos | Não iniciada; o SKILL.md e os artefatos da skill ainda não existem.                                                                                                                               |
| 3. Dados iniciais             | A futura spec 002 ainda não foi escrita/aprovada; 12 itens e conta do professor não foram preparados nesta prática.                                                                               |
| 4. Solicitar empréstimo       | A futura spec 003 ainda não foi escrita/aprovada; catálogo e fluxo não foram implementados. O cálculo preexistente ainda diverge do prazo decidido.                                               |
| 5. ENTREGA.md                 | Ausente. O relatório de avaliação é apoio e não substitui o documento obrigatório na raiz nem as tabelas finais das duas specs.                                                                   |

A sequência de entregas continua verificador → skill → dados → solicitação →
ENTREGA.md. A conclusão do login, incluída no planejamento da conversa, é um
pré-requisito faltante que o enunciado pressupõe já entregue. Deve ser tratada
explicitamente como trabalho separado, sem substituir uma das cinco entregas
ou antecipar implementação não autorizada.

Para cada uma das duas funcionalidades: decisões/lacunas → spec aprovada →
plano aprovado → tarefas → código e testes → verificador → validação de
publicação pelo operador. Decisões aprovadas na conversa e registradas no PRD
não equivalem à aprovação dos futuros documentos completos de spec/plano.

Portanto, a documentação acompanha os requisitos e as escolhas feitas, mas o
cumprimento da prática é parcial. Não marcar as cinco entregas prontas nem
considerar a entrega 1 encerrada a partir apenas do script e da prova de CA-08.

## Implementação de papéis — T-04 aprovada

Após apresentação da revisão da spec/plano/tarefas 001, o operador respondeu
“Pode fazer”, aprovando os documentos e autorizando somente a T-04.
O serviço resolve acesso exclusivamente pela identidade já validada no servidor
e a Membership de suporte_ti. Papéis em outra área e dados extras da identidade
não substituem o papel persistido. Sem identidade/vínculo, acesso recusado;
falhas de banco não concedem acesso nem expõem informações de conexão.

Foram implementados serviço, 11 testes em PostgreSQL real e helper de container
local descartável; o CI foi adaptado para preparar a imagem antes dos testes.
O Docker Desktop foi iniciado, containers de teste removidos e o Compose antigo
preservado. Nenhuma dependência foi instalada, migration criada ou produção
alterada. Ver [evidências de T-04](evidencias/login-t04-2026-11-09.md).

Após autorização específica para a versão temporária, os 22 testes da suíte,
lint, tipos, geração Prisma e build passaram com Node 24.22.1 e pnpm 11.19.0.
T-04 está concluída e validada localmente, com manifesto e lockfile preservados.
O comando padrão do terminal continua 11.25.0; os checks usam o prefixo
`pnpm --package=pnpm@11.19.0 dlx pnpm`. CI remoto/Preview não foram executados.
Não houve commit, push ou deploy.
T-05 integrará identidade validada e middlewares à API; T-02/T-03 completarão
formulário/sessão/páginas. Não foram antecipadas nesta autorização.
As provas antigas do verificador referem-se à spec anterior de oito CAs;
não substituem nova conferência dos onze CAs quando a spec inteira terminar.

## Integração de autorização — T-05

Após concluir T-04, o pedido “Continue” autorizou somente T-05. A API agora
valida identidade com Supabase `getUser`, monta contexto por request e resolve
Membership exclusivamente em suporte_ti. `auth.me` retorna só userId/tenantId/role,
com resposta privada e sem cache; inputs e cabeçalhos não definem permissões.

Testes com PostgreSQL local real comprovam que COLLABORATOR não administra,
ADMIN pode usar ambas as permissões e nenhum papel de outra área amplia acesso.
As operações administrativas de prova existem apenas nos testes, sem publicar
CRUD ou painel de Operações. A conta do professor ainda não foi provisionada.

Geração Prisma, 47 testes, lint, tipos e build passaram com Node 24.22.1 e pnpm
11.19.0. O HTTP local do build retornou 401 sem sessão, inclusive com cabeçalhos
falsos; `/` e `/login` continuaram acessíveis e com envio desabilitado. O teste
HTTP usou configurações fictícias locais; não valida login/refresh no provedor
real. Não houve dependência, migration, commit, push ou deploy novo.
Ver [evidências T-05](evidencias/login-t05-2026-11-09.md).

CI remoto e Preview continuam pendentes. T-02/T-03 completarão formulário,
sessão e páginas; não foram iniciadas. A spec 001 permanece NÃO PRONTA e o
verificador integral será acionado ao terminar suas tarefas.

## Login e sessão — T-02/T-03 autorizadas posteriormente

O operador aprovou “pode fazer tudo” após a proposta de dependências. Foram
instalados somente React Hook Form 7.91.0, resolvers 7.0.5 e utils 0.3.0 transitivo;
as demais versões e a configuração de segurança do workspace foram preservadas.
A revisão automática rejeitou adicionar Playwright como nova dependência;
a conferência visual/funcional usou o navegador conectado já disponível.

Formulário, mutation auth.login, publicação de cookies após confirmar vínculo,
proxy de renovação/proteção e tela mínima /app foram implementados. Auth/tenant/role
continuam resolvidos no servidor; ADMIN de outra área não recebe acesso. Não há
catálogo, cadastro de equipamentos ou painel de Operações nesta fatia.

Passaram geração Prisma, 54 testes, lint, tipos e build com Node 24.22.1 e pnpm
11.19.0. A integração usa build de produção Next e SDK SSR reais, Auth controlado
em loopback e PostgreSQL descartável. Browser confirmou ambos os perfis, erro
genérico, recusa sem vínculo, campos desabilitados durante envio e responsividade.
Ver [evidências](evidencias/login-t02-t03-2026-11-09.md).

A conferência final foi acionada em sessão limpa/read-only pelo script do
projeto; não antecipar seu veredito. CI remoto, Preview e Auth real permanecem
sem validação. Não houve commit, push, deploy ou escrita no Supabase.

Fechamento posterior: foram acrescentados quatro testes de navegador
executáveis para CA-01/02 e um teste de regressão do POST nativo, com falha
demonstrada antes da correção. A suíte completa final passou com 55 testes;
os quatro casos de navegador também passaram no código corrigido.

A [rodada final 03](evidencias/verificador-login-final-20261109-03.md) retornou
PRONTA para os onze CAs, com 45 testes direcionados aprovados, CLI exit 0 e
fontes preservadas. Recebeu PRD, ADRs e todas as fontes da fatia, usando pnpm
11.19.0 em contexto limpo/read-only. O gatilho foi acionado ao concluir as
tarefas, sem pedido separado do operador.

Isso conclui localmente o pré-requisito de login; não conclui as cinco entregas
da prática. As ressalvas históricas do exercício de verificador (adaptação ao
harness, versionamento e commits de prova) não foram apagadas nem promovidas
a evidência nova. Skill de imagens, specs 002/003, dados e ENTREGA.md permanecem
pendentes. Produção, conta do professor e empréstimos de teste continuam sob
execução do operador, nas etapas próprias.

## Aditamento de 10/11/2026 — comparação e fonte das imagens

Após a [comparação dos dois repositórios](comparacao-repos-pratica-sdd.md), o
operador confirmou nesta conversa que o professor orientou usar **Pixabay**.
Essa orientação substitui a fonte Pexels do enunciado no planejamento vigente.
As menções anteriores ao Pexels preservam o contrato original e as verificações
feitas naquele momento; não são autorização para misturar provedores.

O crédito previsto passa a ser “Fotos: Pixabay” com link, mantendo registro
individual de origem, autoria e licença, arquivos 800×600, unicidade, revisão
visual e preparo local. Nenhuma exceção a fotografias, texto, marca ou recorte
foi aprovada por essa resposta. A documentação do Pixabay deve reger a nova
integração; condições do Pexels não serão atribuídas a ele automaticamente.

Esta tarefa produziu análise documental e atualizou planejamento/registro de
decisão, sem criar a skill, buscar imagens com credencial, instalar dependência,
alterar produto/ADRs/schema ou autorizar execução em produção. O estado atual
do verificador e os checks estão no fechamento técnico de 10/11; o ENTREGA.md
já foi iniciado, diferentemente dos registros históricos acima.
