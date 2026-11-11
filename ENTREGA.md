# Entrega da prática

Atualização de 11/11/2026. Código, migrations, inventário, imagens e documentação
estão versionados. O CI passou; as variáveis de produção foram configuradas,
as duas migrations existentes foram aplicadas e os 12 equipamentos foram
populados. O endpoint publicado `/api/health` respondeu HTTP 200.

## Links e revisão

- [Repositório](https://github.com/Kogake7/projeto_vibecoding_emprestimos).
- [Produção](https://projeto-vibecoding-emprestimos.vercel.app).
- [CI completo: 120 testes, Prisma, lint, tipos e build](https://github.com/Kogake7/projeto_vibecoding_emprestimos/actions/runs/42992919261), commit e72e3f9.
- [CI após correção de identidade Auth](https://github.com/Kogake7/projeto_vibecoding_emprestimos/actions/runs/42996724959), commit 551a9a5, aprovado.
- A tag `entrega-pratica` identifica esta revisão do projeto.

## 1. Conflitos: pedido, regra existente e decisão

| Pedido/conflito                            | Regra preservada e motivo                                                                     | Registro/implementação              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------- |
| Cinco empréstimos                          | Limite três, inclusive ADMIN, conforme PRD e decisão do operador                              | PRD; spec 003; 46b96d7              |
| TI-0010 disponível no briefing             | Lista exata prevalece: TI-0004/0007/0010 em manutenção; outros nove disponíveis inicialmente  | spec 002; f784bca                   |
| Senha literal na população                 | Identidade Auth e senha criadas pelo operador; CLI verifica identidade antes da Membership    | spec 002; 327500d                   |
| Instalar sharp automaticamente             | Preparo usa Python/Pillow já instalado; não foi instalada dependência de imagens na aplicação | skill; d47fc15                      |
| Remover créditos das fotos                 | Crédito Fotos: Pixabay e origem/autor/licença por arquivo                                     | spec 003; d47fc15/46b96d7           |
| Operações no ambiente publicado | Destino conferido e comandos de migrations/seed delegados expressamente pelo operador; procedimentos de Auth/Storage no README | README e histórico de execução |
| Verificador corrigir teste                 | Papel independente, somente leitura, devolve achado ao principal                              | agents/verificador-spec.md; e72e3f9 |
| CSS produzir 800×600/repetir foto          | JPEGs reais medidos, doze IDs/hashes diferentes e revisão dos bytes finais                    | relatório de imagens e teste CA-10  |

## 1b. Lacunas e decisões antes do código

| Lacuna             | Alternativas consideradas                                 | Decisão e autoria                                                                                                    |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Professor e papéis | Duas contas ou uma ADMIN cumulativa                       | Operador: uma ADMIN, suporte_ti e zero empréstimos                                                                   |
| Prazo              | Dias corridos ou úteis; contar o pedido ou começar depois | Operador: 14 dias úteis nacionais; solicitação útil conta; mesmo horário America/Sao_Paulo                           |
| Reexecução         | Sobrescrever estado ou preservar histórico                | Sob autorização ampla: preservar IDs/status/histórico e abortar lote com conflito de nome/categoria/patrimônio extra |
| Imagens no modelo  | Novas colunas/migration ou manifesto por patrimônio       | Manifesto público versionado; schema existente suficiente, sem migration nova                                        |
| Recusas e atraso   | Prioridade e fronteira indefinidas                        | Decisão técnica registrada na spec 003: item, atraso, limite; atraso somente depois de dueAt                         |
| Duplo clique       | Reenvio irrestrito ou bloquear envio corrente             | Ref de envio e botão desabilitado; transação/locks protegem concorrência no servidor                                 |
| Calendário         | Consultar serviço a cada pedido ou tabela determinística  | Fonte oficial e cobertura 2026–2030 documentadas; recusa explícita fora da cobertura                                 |

As specs e os planos [002](docs/specs/002-dados-iniciais/spec.md) e
[003](docs/specs/003-solicitar-emprestimo/spec.md) foram escritos antes do código.
Em 11/11 o operador autorizou execução local completa, decisões conservadoras,
subagentes e commits, dispensando aprovações intermediárias individuais.
Essa autorização não foi atribuída retrospectivamente às sessões anteriores.

## 2. Onde o agente tentou decidir pelo operador

O agente propôs começar a contagem no próximo dia útil. O operador determinou
que a solicitação útil conta como dia um, e o PRD foi atualizado antes da
implementação. O [registro de decisões](docs/avaliacao-pratica-sdd-subagentes.md)
preserva a intervenção. Limite, papel do professor e troca para Pixabay são
respostas do operador; prioridade de recusas e política de conflitos foram
escolhas técnicas documentadas sob a autorização ampla posterior.

## 3. Decisão arquitetural e ADR

O verificador usa sessão CLI limpa, read-only/never, conforme alternativa já
prevista no AGENTS. Não se presume que um subagente com escrita seja isolado.
Não foi criado ou alterado ADR para essa adaptação operacional. O monolito,
Next/tRPC/Prisma/Supabase e dono único das migrations foram preservados.
Metadados das imagens são estáticos por patrimônio; nenhuma migration nova
foi criada para esta fatia.

## 4. Skill imagens-equipamentos

A orientação Pixabay foi confirmada pelo operador. A
[skill](skills/imagens-equipamentos/SKILL.md) mantém instruções e bloqueios;
references concentra critérios/contratos; scripts implementa busca com cache
24h, preparo JPEG 800×600, integridade, manifesto e revisão. Credencial é lida
somente de arquivo externo ao Git, não vai ao runtime ou aos logs.

Código garante formato, tamanho, unicidade, hashes e revisão registrada;
inspeção visual verifica pessoa, marca/logo legível, texto e tela com conteúdo.
Foram preparadas doze fotos reais, com 32 rejeições registradas e 20 testes
Python aprovados. TI-0007 recebeu recorte natural de contexto, documentado
antes da finalização; os demais usam foto inteira com padding. Essa foi uma
decisão técnica sob autorização ampla, não uma opinião atribuída ao operador
nem uma permissão copiada dos colegas.

Ver [relatório com fontes](docs/evidencias/imagens-20261111.md),
[manifesto](public/equipment/manifest.json) e
[revisões](public/equipment/review-log.json). O procedimento de publicação dos
arquivos no Storage está no README.

## 5. Subagente verificador

Fonte: [papel](agents/verificador-spec.md). Gatilho obrigatório em
[rules/spec-flow.md](rules/spec-flow.md). O principal fornece spec, plano,
tarefas, fontes numeradas, hashes e resultados; a sessão isolada não escreve,
não publica, não migra e não usa conectores do banco. O gate recusa testes
falhando, fontes alteradas, parecer incompleto ou CAs sem evidência.

O [procedimento](docs/verificador-spec.md) distingue testes locais de evidência
real do CI. Os recibos identificam origem, execução e equivalência dos blobs,
sem alegar execução local inexistente. Imagens são anexadas explicitamente
com hashes, não apenas descritas no texto. Testes técnicos e provas de bloqueio
estão preservados; isso não substitui validação de produção.

## 6. Verificador em ação e tabelas

A prova versionada de 11/11 criou dois commits reais:

| Estado                    | Commit  | Teste de CA-08 | Parecer de CA-08 |
| ------------------------- | ------- | -------------- | ---------------- |
| Link de cadastro plantado | 4fcdbaa | exit 1         | REPROVADO        |
| Componente restaurado     | 61e2d8b | exit 0         | ATENDIDO         |

O [resumo](docs/evidencias/prova-verificador-20261111-versionada.json) comprova
restauração byte a byte de componente/teste. Relatórios
[plantado](docs/evidencias/verificador-20261111-versionada-plantado.md) e
[restaurado](docs/evidencias/verificador-20261111-versionada-restaurado.md)
analisam o mesmo escopo e IDs; recusam corretamente a spec inteira por serem
uma conferência parcial. Nenhum head intencionalmente quebrado foi publicado.

| Spec            | Conferência e limites atuais                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 001 Login       | [Parecer histórico PRONTA](docs/evidencias/verificador-login-final-20261109-03.md), onze CAs locais; regressão integra o CI atual                                                               |
| 002 Dados       | [Rodada 11/11](docs/evidencias/verificador-20261111-final-002.md) encontrou lacunas de teste CA-04/07; foram corrigidas em 327500d e o novo CI passou; correção coberta pelo novo CI |
| 003 Solicitação | [Rodada 11/11](docs/evidencias/verificador-20261111-final-003.md): CA-01–08 atendidos; prova dinâmica de CA-09/11 e entrega Storage de CA-10 continuam pendentes                                |

Os relatórios preservam as tabelas de critérios e os resultados de cada rodada.

## 7. Regra operacional posta à prova

Gerar um relatório com exit zero não significa PRONTA. O executor passou a
interpretar o veredito e exigir cobertura dos CAs; testes de recusa verificam
o gate. Quando o CI foi usado, o formato do recibo foi corrigido para dizer
explicitamente GitHub Actions, sem inventar uma execução na cópia local.
O gatilho continua obrigação do fluxo; não se alega um hook global instalado.

## 8. Escopo e operação

Devolução, painel de Operações, reserva futura, e-mail e renovação não fazem
parte desta fatia. Os repositórios dos colegas foram somente referência e
não foram alterados. Material bruto com credencial foi saneado antes do Git;
a cópia original ficou fora do repositório. Não foram publicados .env,
credenciais, caches de fotos ou ZIPs de entrega anterior.

Os comandos de operação e a conferência de Auth, Membership e Storage estão
no [README](README.md). O professor deve permanecer com zero empréstimos;
testes usam identidade própria. A entrega é pelos links do GitHub e da Vercel,
sem arquivo ZIP ou envio automático do formulário.
