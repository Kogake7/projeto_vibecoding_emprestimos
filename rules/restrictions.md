# Restrições de trabalho

> Leitor: agente

Este arquivo complementa o `AGENTS.md` e define limites para agentes e assistentes que trabalham neste repositório. Em caso de conflito, aplique a regra mais restritiva e preserve as decisões de produto e arquitetura já documentadas.

## ADRs

- Criar um novo ADR é permitido quando fizer parte do escopo solicitado.
- Alterar, reestruturar, renomear ou excluir um ADR existente exige autorização
  explícita do operador para aquele ADR e aquela mudança.
- Antes de alterar um ADR existente, avise que a ação muda uma decisão
  arquitetural e registre que a autorização explícita foi recebida.
- Não transforme automaticamente uma discussão técnica em ADR.

## Significado de "Pode executar"

Quando o usuário disser **"Pode executar"**, isso autoriza somente a próxima tarefa concreta do plano, e não o plano inteiro.

Para cada autorização:

1. Executar uma única tarefa coerente e verificável.
2. Parar ao concluir essa tarefa.
3. Informar o que foi alterado, quais validações foram executadas e o resultado.
4. Apontar riscos, dúvidas ou desvios encontrados.
5. Identificar a próxima tarefa proposta e aguardar nova autorização antes de executá-la.

Uma tarefa pode conter os pequenos passos inseparáveis necessários para produzir um resultado válido, como alterar uma função e atualizar seu teste. Ela não deve incluir outra feature, refatoração independente, migration adicional ou etapa posterior do plano.

## Escopo das alterações

- Fazer somente mudanças necessárias para a tarefa autorizada.
- Não aproveitar uma tarefa para realizar limpeza ampla, renomeações, atualização de dependências ou refatorações não solicitadas.
- Não implementar itens futuros do plano por antecipação.
- Não alterar regras de negócio, escopo do MVP ou decisões da stack sem instrução explícita.
- Se a tarefa estiver ambígua, escolher apenas uma interpretação quando ela for pequena, segura e facilmente reversível; caso contrário, pedir esclarecimento.

## Segurança e dados

- Nunca incluir senhas, tokens, cookies, chaves de API, credenciais ou valores reais de `.env` em código, logs, testes, commits ou respostas.
- Nunca executar comandos destrutivos, apagar dados, recriar banco, forçar push ou alterar produção sem pedido explícito e confirmação específica.
- Não aplicar migrations em produção sem autorização explícita para a migration e o ambiente exatos.
- Antes de qualquer alteração em produção ou deploy, avisar sobre o impacto e recapitular a ação, o ambiente e o destino.
- Não modificar configurações ou dados no Supabase, Vercel ou GitHub como efeito colateral de uma tarefa local; a alteração precisa estar explicitamente autorizada.
- Não contornar autenticação, autorização, isolamento de tenant, RLS ou validação de entrada para acelerar uma entrega.

## Dependências e ferramentas

- Não instalar, remover ou atualizar dependências sem necessidade direta da tarefa e sem informar o impacto.
- Preferir os scripts existentes no `package.json`.
- Não trocar framework, ORM, banco, padrão de API, biblioteca de estado ou estratégia de autenticação.
- Não criar serviços externos, recursos pagos ou novas contas em nome do usuário.

## Qualidade e validação

- Não declarar uma tarefa concluída sem verificar o resultado de forma proporcional ao risco.
- Para mudanças de comportamento, adicionar ou atualizar testes relevantes.
- Não mascarar falhas de lint, tipos, testes ou build desativando regras, removendo testes ou usando tipos inseguros sem justificativa explícita.
- Se uma validação não puder ser executada, informar claramente o motivo e o risco restante.
- Não corrigir falhas preexistentes fora do escopo; registrá-las separadamente no feedback.

## Feedback obrigatório após cada tarefa

O retorno deve ser curto e conter:

- **Concluído:** resultado entregue.
- **Arquivos alterados:** caminhos dos arquivos modificados.
- **Validação:** comandos ou verificações executados e seus resultados.
- **Observações:** riscos, bloqueios ou achados relevantes, se existirem.
- **Próxima tarefa:** apenas a próxima etapa sugerida, sem executá-la.

## Exceções

- Uma autorização ampla só substitui a regra de uma tarefa por vez quando o usuário disser de forma inequívoca que deseja executar todo o plano ou várias tarefas identificadas.
- Mesmo com autorização ampla, mudanças destrutivas, publicação, deploy, alterações em produção e uso de credenciais exigem autorização explícita para o alvo e a ação exatos.
