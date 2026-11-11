# Plano de conclusão da prática SDD e subagentes

Planejamento de 10/11/2026, solicitado pelo operador. Este documento organiza
o trabalho restante; não aprova specs, DDL, dependências ou publicação.
Etapa 1 implementada e com novas provas locais de bloqueio e erro/restauração;
ver [fechamento técnico](evidencias/fechamento-verificador-20261110.md).
Retomada de 11/11/2026: Docker operacional; os 55 testes passaram numa cópia
temporária fora do OneDrive, com fontes idênticas e build aprovado. O diretório
original ainda apresenta EPERM no cache gerado pelo Next. Encerramento integral
pendente desse ajuste do ambiente, dos commits exigidos e da validação remota.
Etapas 2–4 implementadas e testadas no CI em 11/11; encerramento e validação externa ainda têm as pendências registradas no ENTREGA.md.

Antes de retomar a implementação, considerar a
[comparação dos dois repositórios](comparacao-repos-pratica-sdd.md): ela separa
exigências das aulas/prática, escolhas particulares e reforços técnicos a
avaliar. Suas recomendações não equivalem a autorização de implementação.

## Base e decisões preservadas

- Fontes: [enunciado](../pratica-sdd-subagentes/pratica-sdd-subagentes.html),
  [avaliação](avaliacao-pratica-sdd-subagentes.md), [PRD](PRD.md),
  [ADR-001](adr/001-stacks.md), [checks](../rules/checks.md),
  [fluxo SDD](../rules/spec-flow.md) e [operação](../rules/operacao.md).
- Login: há parecer local PRONTA e checks registrados em
  [rodada final 03](evidencias/verificador-login-final-20261109-03.md).
  CI remoto, Preview e provedor real ainda precisam de validação.
- Limite de três empréstimos abertos, inclusive para ADMIN.
- Prazo de 14 dias úteis, excluindo fins de semana e feriados nacionais
  brasileiros; mesmo horário em America/Sao_Paulo. Solicitação conta como dia
  um quando útil; caso contrário, o primeiro dia útil seguinte é o dia um.
- Doze equipamentos exatos; TI-0004, TI-0007 e TI-0010 em manutenção inicial,
  nove disponíveis. Reexecução não pode reabrir itens emprestados.
- Uma conta do professor, ADMIN em suporte_ti, com acesso às funções pessoais
  e administrativas. Deve permanecer com zero empréstimos.
- Solicitar cria o empréstimo imediatamente, sem aprovação ou fila.
- Fotos exclusivamente pela API Pixabay, conforme orientação do professor
  confirmada pelo operador nesta conversa em 10/11/2026. Crédito “Fotos:
  Pixabay” com link; demais garantias da prática preservadas. Substitui Pexels
  no planejamento, sem aprovar recortes, ilustrações ou outras exceções.
- Escritas no banco e Storage do deploy são executadas pelo operador.
- Devolução, painel de Operações e demais itens fora desta fatia não serão
  implementados para concluir a prática.

## Etapa 1 — fechar a entrega do verificador

1. Inventariar requisito por requisito: prova existente, lacuna e ação mínima.
   Separar alterações anteriores, material bruto sensível e artefatos de teste
   antes de propor qualquer commit.
2. Conferir a adaptação ao harness: contexto limpo, somente leitura, bloqueio
   de publicação/migration/escrita remota e gatilho de prontidão. Registrar
   explicitamente os limites da sessão CLI descritos em
   [verificador-spec](verificador-spec.md).
3. Preparar uma prova reproduzível de erro plantado: base, reprovação e
   restauração, com os mesmos IDs de CA e hashes. Reutilizar evidências válidas;
   se forem necessários novos commits, executar uma nova prova após autorização,
   sem simular que os commits existiam nas rodadas antigas. Nenhum estado com
   erro será publicado.
4. Iniciar o ENTREGA.md com conflitos e decisões já documentados, apontando
   pendências sem preencher resultados ou hashes inexistentes.

Saída: matriz de requisitos/evidências e pendências do verificador resolvidas
ou explicitamente dependentes de decisão/autorização. A aceitação da adaptação
ao harness não será presumida como aprovação do professor.

A primeira autorização executou somente o inventário do item 1. O pedido
posterior “Complete a primeira tarefa” foi tratado como completar esta etapa:
executor ajustado, prova local repetida e ENTREGA.md iniciado. Não autorizou
commit, push, tag ou publicação. O Docker foi recuperado sem reset ou remoção
de dados e a suíte integral passou na cópia temporária em 11/11. O erro do cache
no OneDrive permanece no diretório original; não houve mudança do código para
contorná-lo. O versionamento proposto segue dependente de autorização específica.

## Etapa 2 — criar a skill imagens-equipamentos

1. Apresentar a proposta de divisão entre SKILL.md, references e scripts,
   incluindo o mecanismo que impede envio ao deploy. Levantar escolhas de
   seleção/corte/reprovação das fotos para decisão do operador.
2. Consultar a documentação oficial do Pixabay e usar as skills pertinentes
   ao criar a skill e preparar a integração com Storage.
3. Implementar preparação local com saída determinística por patrimônio,
   manifesto de foto/autor/origem/licença e validações de dimensões 800×600,
   unicidade de foto e integridade do conjunto. Justificar qualquer dependência
   necessária e obter autorização específica antes da instalação.
4. Selecionar as doze imagens e realizar revisão visual de pessoas, marcas,
   logos, textos e telas. Registrar reprovações e substituições.
5. Entregar os arquivos aprovados e o procedimento humano de upload idempotente.
   O preparo não recebe credencial de escrita do Storage do deploy.

Saída: skill utilizável, doze arquivos medidos e revisados, manifesto completo,
testes relevantes do preparo e evidência do bloqueio de envio pelo agente.
Upload e validação das URLs públicas ficam para a etapa externa.

## Etapa 3 — spec 002: dados iniciais

1. Levantar lacunas com alternativas: comportamento se conta, membership ou
   equipamento já existir; preservação de dados e imagens na reexecução;
   armazenamento dos metadados e fluxo de provisionamento humano.
2. Após as decisões, escrever docs/specs/002-dados-iniciais/spec.md com CAs;
   derivar plan.md e tasks.md. Submeter spec e plano antes de implementar.
3. Se persistência exigir mudança, apresentar DDL, RLS, compatibilidade,
   dados existentes e alvo local conforme [migrations](../rules/migration.md).
   Gerar e testar a migration somente depois da autorização específica.
4. Implementar uma tarefa por vez: inventário idempotente, metadados das
   imagens e preparo do provisionamento da conta, sem senha literal ou
   alteração de conta real pelo agente.
5. Testar banco vazio, upgrade, duas execuções e preservação de conta,
   empréstimos e estados existentes, em PostgreSQL local real.
6. Executar checks e delegar a conferência isolada da spec completa.
   Corrigir pelo principal e repetir até os CAs terem evidência suficiente.

Saída: spec 002 implementada e verificada localmente, pacote e instruções para
o operador popular o deploy. A validação no deploy permanece identificada.

## Etapa 4 — spec 003: catálogo e solicitação imediata

1. Resolver lacunas com o operador: navegação e feedback, reenvio/duplo clique,
   prioridade entre motivos de recusa, definição de atraso na fronteira do
   vencimento e fonte/cobertura/manutenção do calendário de feriados nacionais.
2. Escrever docs/specs/003-solicitar-emprestimo/spec.md, plan.md e tasks.md,
   incorporando as decisões vigentes. Aprovar spec e plano antes do código.
3. Implementar em tarefas separadas: catálogo com imagens/crédito e bloqueios;
   calendário; solicitação transacional com auditoria; meus empréstimos;
   integração da interface e estados de loading, vazio, sucesso e erro.
4. Provar concorrência para o mesmo equipamento e para equipamentos diferentes
   do mesmo usuário próximo ao limite. Não depender apenas do índice único
   de empréstimo aberto por equipamento.
5. Testar limite três, atraso, manutenção, indisponibilidade, datas fixas e
   feriados/virada de ano, ADMIN nas funções pessoais e isolamento de tenants.
6. Executar checks, fluxo completo no navegador e verificador isolado de
   todos os CAs; achados voltam ao principal para correção.

Saída: spec 003 implementada e verificada localmente, com evidência de atomicidade,
permissões, calendário e fluxo de interface. A revisão visual seguirá os ADRs
aplicáveis e a skill do projeto, sem ampliar silenciosamente o ADR-003.

## Etapa 5 — integração e validação externa

1. Revisar o diff e organizar commits por tarefa, separando código e regras,
   somente quando solicitados. Manter o material bruto sensível fora deles.
2. Preparar o destino de Preview e seu banco isolado, variáveis sem expor
   valores, migrations exatas, plano de publicação e verificações do operador.
   Apresentar o pacote concreto antes das autorizações de escrita/publicação.
3. Após as autorizações necessárias, verificar CI e Preview: login/renovação,
   catálogo, imagens, solicitação, meus empréstimos, recusas e logs.
   Banco e Storage do deploy continuam sob execução humana.
4. Com ação, ambiente e destino de produção explicitamente autorizados,
   acompanhar a aplicação das migrations pelo operador, upload, provisionamento
   e publicação; conferir URLs públicas e correspondência com as specs.
5. Conduzir a conferência final prevista no enunciado. Escritas de testes no
   deploy são feitas pelo operador com conta própria; professor fica sem
   empréstimos. Registrar os resultados e falhas reais, sem apagar histórico.

Saída: evidência de funcionamento no ambiente publicado, CI conferido,
inventário/imagens corretos e conta do professor preservada.

## Etapa 6 — fechar ENTREGA.md e marcar a entrega

1. Completar o documento iniciado na etapa 1 com conflitos, lacunas,
   alternativas/motivos do operador, decisão sobre ADR, divisão da skill,
   bloqueios técnicos, histórico do verificador e tabelas finais das specs 002/003.
2. Vincular cada afirmação a arquivo/linha, relatório, resultado ou commit real;
   incluir links de repositório e produção e declarar limites restantes.
3. Conferir que a revisão publicada corresponde à revisão entregue. Após o
   pedido explícito de commit/push/tag e indicação do destino, marcar e publicar
   entrega-pratica no commit final conferido. Verificar o alvo da tag.

Saída: repositório, ENTREGA.md, tag e produção coerentes e rastreáveis.

## Validação e andamento

Cada tarefa de código segue [checks](../rules/checks.md): geração Prisma, testes,
lint, typecheck e build com Node 24 e pnpm 11.19.0; smoke dos fluxos afetados e
validação remota quando aplicável. Não ampliar testes sem nova necessidade.
Persistência, RLS e concorrência usam PostgreSQL local real; testes funcionais
citam os CAs e regras de datas usam relógio fixo.

Cada conclusão informa entregável, arquivos, validações e pendências; o
handoff é atualizado. O ENTREGA.md recebe evidências ao longo do trabalho.
Este plano geral não substitui os planos técnicos derivados de cada spec.

O pedido inicial cobriu planejamento; “Pode continuar” autorizou o inventário;
“Complete a primeira tarefa” foi tratado como conclusão da etapa 1. O limite
de autorização não foi ampliado para as etapas seguintes nem para commit ou
publicação. Valem as [restrições](../rules/restrictions.md).
Spec/plano, dependências, migrations, commits, push e publicação seguem os
pontos de aprovação específicos das regras, com a proposta concreta preparada
antes de solicitar a decisão correspondente.
