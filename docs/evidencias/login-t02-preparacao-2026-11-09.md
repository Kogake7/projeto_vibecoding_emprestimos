# Preparação T-02 — Dependências do formulário

Data: 09/11/2026. Após concluir T-05, o operador pediu “Continue”, autorizando
a próxima tarefa, T-02. A implementação aguarda aprovação específica das
dependências ausentes, conforme o plano aprovado e `rules/operacao.md`.
T-03, commit, push e deploy não estão autorizados nesta etapa.

## Proposta concreta

O ADR-001 exige React Hook Form com zodResolver. O package.json já contém
React 19, Zod 4, tRPC e TanStack Query, mas não os dois pacotes abaixo.

| Pacote proposto           | Uso                                         | Compatibilidade consultada                                    |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| react-hook-form@7.91.0    | Estado, validação e envio do formulário     | React 19 aceito; Node >=18, compatível com Node 24 do projeto |
| @hookform/resolvers@7.0.5 | zodResolver para o schema Zod compartilhado | React Hook Form ^7.55.0 e Zod ^4.0.0 aceitos                  |

Ambos declaram licença MIT. O resolver declara a dependência transitiva
`@standard-schema/utils` ^0.3.0. Os outros validadores listados em seus peers
são opcionais; o projeto continuará usando Zod.

Após aprovação, executar com o gerenciador já adotado:

```powershell
pnpm --package=pnpm@11.19.0 dlx pnpm add --save-exact react-hook-form@7.91.0 @hookform/resolvers@7.0.5
```

Impacto esperado: package.json, pnpm-lock.yaml e instalação local, incluindo
resolução transitiva. Sem atualização deliberada das demais dependências.
Não cria schema, migration, serviço externo ou variável de ambiente.

## Consulta executada e limites

Consultados somente metadados públicos via `pnpm view`: versões, peers,
peerDependenciesMeta, dependências, engines e licença. Nenhum pacote foi
instalado e nenhum código de T-02 foi alterado nesta preparação.

Referências primárias: [React Hook Form](https://react-hook-form.com/get-started),
[resolvers](https://github.com/react-hook-form/resolvers), metadados versionados
do [formulário](https://registry.npmjs.org/react-hook-form/7.91.0) e do
[resolver](https://registry.npmjs.org/@hookform%2Fresolvers/7.0.5).

A regra aplicável é “Instalar ou atualizar dependência — pedir antes”, com
“pedir antes — descreva o que pretende fazer e PARE”. O plano 001 também exige
apresentar dependências e impacto antes da instalação para T-02.

Não foram repetidos testes/build: a mudança desta preparação é documental.
T-05 continua validada localmente; os 47 testes anteriores não são prova de T-02.
Após aprovação, implementar e testar envio via tRPC, validação compartilhada,
estados de envio/erro e mensagem genérica, mantendo o visual aprovado.

## Aprovação posterior

O operador respondeu “pode fazer tudo”. Foram instalados os dois pacotes exatos
apresentados e sua dependência transitiva utils 0.3.0. Manifesto e lockfile têm
somente essas adições; as demais versões foram preservadas. A exceção de idade
de publicação adicionada automaticamente pelo pnpm foi removida, preservando
a configuração de segurança anterior do workspace.

A instalação adicional de @playwright/test 1.65.0 foi rejeitada pela revisão
automática por exigir aprovação específica; nada foi instalado nessa tentativa.
A verificação no navegador pode usar a automação Playwright já disponibilizada
pelo navegador conectado, sem instalar o pacote rejeitado.
