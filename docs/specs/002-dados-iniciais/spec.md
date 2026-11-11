# Spec 002 — Dados iniciais da prática

Definida em 11/11/2026 antes da implementação. O operador autorizou executar
todo o escopo local, registrar decisões conservadoras e dispensar aprovação
intermediária de cada spec/plano. Banco, Auth e Storage publicados continuam
sob execução humana conforme o enunciado. Não há alteração de schema.

## Objetivo e escopo

Preparar o tenant suporte_ti, os doze equipamentos exatos do enunciado e o
vínculo ADMIN do professor, sem criar empréstimos, redefinir senhas ou apagar
dados. Catálogo e solicitação pertencem à spec 003; o preparo das fotos pertence
à skill imagens-equipamentos.

## Decisões e comportamento

- A lista canônica fica em src/shared/equipment-inventory.json, transcrita do
  enunciado, incluindo nomes, categorias e termos de busca.
- TI-0004, TI-0007 e TI-0010 começam em MAINTENANCE; os demais nove, AVAILABLE.
- Reexecução preserva IDs, status atuais, contas, empréstimos e auditoria.
- Nome/categoria conflitantes ou patrimônios extras em suporte_ti abortam o
  lote inteiro. Não corrigir nem remover dados existentes silenciosamente.
- Outro tenant não é lido como inventário do suporte_ti nem alterado.
- A identidade do professor é criada pelo operador no Supabase Auth. O
  procedimento vincula apenas a identidade de marcelo.grilo@institutojef.org.br
  já existente; exige zero empréstimos e ADMIN. Papel existente conflitante
  causa recusa, sem elevação implícita. Nenhuma senha integra código ou docs.
- Fotos e créditos ficam em manifesto público versionado, associado por
  patrimônio, sem nova coluna ou migration. Não registrar foto inexistente.
- Comandos de população/provisionamento exigem confirmação explícita do alvo;
  variáveis de conexão existentes são reutilizadas sem imprimir seus valores.

## Critérios de aceite

- CA-01 — Em banco local vazio, criar suporte_ti e exatamente os doze itens,
  com nomes/categorias exatos, três em manutenção e nove disponíveis.
- CA-02 — Duas execuções preservam IDs e quantidade; alteração operacional de
  status, empréstimo existente e auditoria sobrevivem à reexecução.
- CA-03 — Conflito de nome/categoria ou patrimônio extra recusa toda a operação
  sem criação parcial, redefinição de estado ou exclusão.
- CA-04 — O procedimento do professor exige identidade verificada para o
  e-mail fixo, cria ou preserva somente ADMIN e recusa empréstimos existentes
  ou papel conflitante. Nenhum teste cria empréstimo para a conta real.
- CA-05 — Execução sem confirmação ou com alvo divergente falha antes de
  escrever; mensagens não expõem conexão, senha ou token.
- CA-06 — Equipamentos, memberships e empréstimos de outro tenant permanecem
  intactos nas execuções e nas recusas.
- CA-07 — A lista pública contém os doze patrimônios e os termos de busca
  originais; metadados de imagens são fornecidos pelo manifesto da skill,
  sem alteração de schema ou fabricação de procedência.

## Validação e limites

Persistência e rollback são testados em PostgreSQL local descartável com as
migrations existentes. Provisionamento de identidade, execução no banco remoto
e conferência do professor publicado são etapas humanas, registradas
separadamente da validação local. Não declarar execução externa inexistente.
