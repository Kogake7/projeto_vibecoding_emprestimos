# Spec 003 — Catálogo e solicitação imediata

## Objetivo e autorização

Permitir que um membro de suporte_ti consulte o catálogo, solicite um item e
acompanhe seus empréstimos abertos. Em 11/11/2026, o operador autorizou a
execução local completa e decisões conservadoras documentadas, com spec e
plano antes do código e sem aprovação intermediária individual. Essa
autorização não permite migrations, alteração de ADR, push ou deploy.

Fontes: [PRD](../../PRD.md), [ADR-001](../../adr/001-stacks.md),
[ADR-002](../../adr/002-design-system.md), [fluxo](../../../rules/spec-flow.md)
e [plano da prática](../../plano-pratica-sdd-subagentes.md).

## Comportamento e decisões de lacunas

- As rotas /app e /app/meus-emprestimos exigem sessão e Membership no tenant
  suporte_ti. COLLABORATOR e ADMIN usam as mesmas regras pessoais; não existe
  exceção de limite ou prazo para ADMIN.
- O catálogo mostra todos os equipamentos do tenant, inclusive os três em
  manutenção inicial. Patrimônio, nome, categoria e situação são visíveis.
- Solicitar cria imediatamente um Loan aberto, muda Equipment para LOANED e
  grava um AuditEvent com ator e recurso. As três escritas são atômicas.
- Não há fila, aprovação, reserva futura, devolução ou painel de Operações
  nesta fatia. A conta do professor não é usada nos empréstimos de teste.
- São permitidos até três empréstimos abertos. Há atraso somente quando
  dueAt é estritamente anterior ao instante atual; no vencimento exato ainda
  não há atraso. Empréstimos devolvidos não contam.
- Prioridade da recusa: item inexistente/fora do tenant, item indisponível,
  empréstimo próprio atrasado, limite de três. A resposta não revela dados
  de outro tenant ou usuário.
- O prazo é de 14 dias úteis no fuso America/Sao_Paulo, incluindo a data da
  solicitação como dia um se útil; caso contrário, o dia um é o próximo útil.
  Mantêm-se hora, minuto, segundo e milissegundo locais. Não se usa 14×24h.
- Calendário local determinístico: fins de semana, nove feriados nacionais
  fixos e Paixão de Cristo, conforme calendário federal publicado pelo MGI.
  Carnaval, Corpus Christi, pontos facultativos e feriados locais não entram.
  Cobertura operacional 2026–2030, inclusive os dias do vencimento; datas fora
  dela falham explicitamente. A extensão exige revisão anual da fonte.
- Uma repetição para o mesmo equipamento já emprestado é recusada, sem novo
  Loan ou evento. Solicitações simultâneas são serializadas para proteger o
  mesmo item e o limite do mesmo usuário em itens diferentes.
- Meus empréstimos apresenta apenas os próprios abertos, com patrimônio,
  nome, data de solicitação, vencimento e indicação de atraso. Históricos
  devolvidos ficam fora desta fatia. Listas usam paginação por cursor.
- Fotos provêm do manifesto versionado preparado pela skill Pixabay. Não há
  migration para metadados estáticos dos doze itens. Foto ausente é indicada
  como pendente; placeholder não vale como foto aprovada. A falta das fotos
  impede aprovação do critério visual, sem impedir testar empréstimos locais.
- Feedback de sucesso mostra o vencimento e atualiza catálogo e empréstimos.
  Durante envio, o botão fica desabilitado. Falhas deixam a interface
  utilizável e os dados são novamente consultados; não se simula sucesso.

## Critérios de aceite

- CA-01 — Catálogo autenticado lista todos os equipamentos do tenant com
  patrimônio, nome, categoria e estado; manutenção e empréstimo não são
  apresentados como disponíveis; paginação não mistura tenants.
- CA-02 — Solicitar item disponível cria imediatamente um empréstimo próprio
  aberto, com datas do servidor, muda a situação e devolve sua identificação.
- CA-03 — Quarto empréstimo e novo pedido de usuário com atraso são recusados;
  devolvidos não contam e ADMIN segue as mesmas regras.
- CA-04 — Vencimento segue os 14 dias úteis, feriados nacionais, contagem
  inclusiva e hora local especificados, inclusive fins de semana e virada
  de ano; calendário fora da cobertura falha explicitamente.
- CA-05 — Item em manutenção, emprestado, inexistente ou de outro tenant não
  pode ser solicitado; a falha não muda Loan, Equipment ou AuditEvent.
- CA-06 — Concorrência no mesmo item produz somente um empréstimo; requisições
  do mesmo usuário próximo ao limite não excedem três; falha de auditoria
  reverte empréstimo e situação do equipamento.
- CA-07 — Procedures exigem sessão e vínculo, derivam usuário/tenant/papel do
  contexto e recusam campos de identidade no input; um tenant não lê nem
  altera dados de outro, inclusive por cursores forjados.
- CA-08 — Meus empréstimos lista somente abertos do próprio usuário, com
  datas e atraso; nenhum usuário ou ADMIN lê empréstimos pessoais de outro
  por essa procedure; paginação mantém esse isolamento.
- CA-09 — Interface mostra carregamento, vazio, erro, envio e sucesso; bloqueia
  clique repetido enquanto envia e atualiza as listas após mutação.
- CA-10 — Os doze itens usam fotos Pixabay distintas, aprovadas visualmente,
  em arquivos 800×600, com manifesto de origem/autoria/licença e crédito
  visível “Fotos: Pixabay” com link. Imagem pendente não satisfaz este CA.
- CA-11 — COLLABORATOR e ADMIN conseguem usar catálogo e seus empréstimos;
  rotas diretas sem sessão continuam redirecionando ao login.

## Contrato de API

- equipment.list({ cursor?: UUID, limit?: 1..50 }) retorna items com id,
  assetTag, name, category e status, além de nextCursor. Padrão: 12 itens.
- loans.mine({ cursor?: UUID, limit?: 1..50 }) retorna items com id,
  equipmentId, issuedAt, dueAt, returnedAt e equipment (id, assetTag, name,
  category, status), além de nextCursor. Somente abertos; padrão: 12 itens.
- loans.request({ equipmentId: UUID }) retorna id, equipmentId, issuedAt,
  dueAt e returnedAt=null. Schemas estritos; nenhum input de identidade.

## Validação e limites

Testes de regras usam datas fixas; persistência e concorrência usam PostgreSQL
local descartável e procedures reais. A conferência de prontidão segue
rules/spec-flow.md em sessão isolada, com todos os CAs. Validação local não
declara upload, conta real, CI ou produção concluídos; escritas no ambiente
publicado continuam sob execução do operador.
