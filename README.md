# Equipamentos internos

Projeto de Inovação e Tecnologia iniciado em 14/09/2026, conforme [PRD](docs/PRD.md) e [ADR da stack](docs/adr/001-stacks.md).
Next.js, tRPC, Supabase Auth e Prisma; migrations pertencem exclusivamente ao Prisma. A [modelagem](docs/database/initial-model.md) é documentação, não script de aplicação.

## Executar e verificar localmente

Use Node.js 24, pnpm 11.19.0 e PostgreSQL. Copie `.env.example` para `.env` e preencha somente as conexões/chaves do ambiente escolhido:

- `DATABASE_URL`: runtime pelo Supavisor, porta 6543, com `pgbouncer=true&connection_limit=1`.
- `DIRECT_URL`: conexão direta de migrations, porta 5432.
- `SUPABASE_URL`: URL do projeto de autenticação.
- `SUPABASE_ANON_KEY`: chave pública anon desse projeto; nunca use chave service_role no navegador.

```sh
pnpm install
pnpm db:generate
pnpm dev
```

Acesse `http://localhost:3000`. Com Docker, `pnpm local:up` sobe aplicação e PostgreSQL; `pnpm local:down` encerra sem apagar o volume.
Para aplicar migrations existentes em banco local, use `pnpm db:deploy`. Migrations em ambiente compartilhado exigem revisão e autorização específicas.

```sh
pnpm db:generate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Os testes criam PostgreSQL local descartável; nunca apontam para Supabase remoto. O build usa Webpack. No Windows, prefira uma pasta fora do OneDrive: o cache `.next` apresentou EPERM na pasta sincronizada.

## Operação do ambiente publicado

Destino desta entrega: Supabase `elyivfytdbplvnfxhpqw`; Vercel `dmitri8/projeto-vibecoding-emprestimos`, branch `main`.
URL: [projeto-vibecoding-emprestimos.vercel.app](https://projeto-vibecoding-emprestimos.vercel.app).
Se precisar da CLI, execute `pnpm --package=vercel@65.14.0 dlx vercel login`, conclua a autorização normal no navegador e confirme a conta com `pnpm --package=vercel@65.14.0 dlx vercel whoami`. Confira o projeto existente antes de vincular ou puxar variáveis; não crie outro projeto.
Configure as quatro variáveis também nos ambientes Preview/Production correspondentes, sem copiar valores para Git ou logs.
Em 11/11/2026, as quatro variáveis de produção foram configuradas, as migrations existentes foram aplicadas e os 12 equipamentos foram populados. O endpoint publicado `/api/health` respondeu HTTP 200.

Para uma reexecução autorizada, confira primeiro que as conexões apontam ao projeto acima:

```sh
pnpm db:seed --apply --confirm-target elyivfytdbplvnfxhpqw
```

O seed cria `suporte_ti` e os 12 equipamentos exatos; reexecução preserva IDs, empréstimos e estados operacionais. Conflitos abortam o lote, sem reset.
Antes de testes que emprestam itens, conferir 12 equipamentos: nove `AVAILABLE` e TI-0004, TI-0007 e TI-0010 em `MAINTENANCE`. Depois de uso real, a reexecução não deve restaurar disponibilidade.

No painel Supabase Auth, o operador cria ou confere `marcelo.grilo@institutojef.org.br`, com a senha definida no enunciado, sem registrá-la em arquivos ou comandos. Copie o UUID da identidade e substitua `<UUID>`:

```sh
node --import=tsx scripts/provisionar-professor.ts --apply --confirm-target elyivfytdbplvnfxhpqw --user-id <UUID>
```

O comando verifica UUID/e-mail e exige ausência de empréstimos e papel compatível. Deve resultar em `ADMIN`, zero empréstimos. Não cria identidade Auth nem redefine senha.
Confira no painel que há uma única identidade do professor, Membership ADMIN em `suporte_ti` e nenhum Loan associado. Não teste empréstimos com essa conta.

## Fotos Pixabay e upload humano

Use Python 3 e Pillow já disponíveis. Obtenha a chave em [Pixabay API](https://pixabay.com/api/docs/) e salve-a em arquivo privado fora do Git; ela não é variável de runtime da aplicação.
Nos comandos PowerShell abaixo, substitua todos os marcadores. Os formatos de seleção e revisão estão no [contrato do preparo](skills/imagens-equipamentos/references/preparo.md).

```powershell
$preparo = 'skills/imagens-equipamentos/scripts/prepare_images.py'
python $preparo search-inventory --credentials-file '<arquivo-da-chave>' --work-dir '<cache-externo>'
python $preparo download --work-dir '<cache-externo>' --photo-id <id-selecionado>
python $preparo prepare --work-dir '<cache-externo>' --selection '<selecao.json>' --output-dir '<pacote-externo>' --public-base-url 'https://elyivfytdbplvnfxhpqw.supabase.co/storage/v1/object/public/<bucket>/'
python $preparo finalize --package-dir '<pacote-externo>' --reviews '<revisoes.json>'
python $preparo validate --package-dir '<pacote-externo>'
```

Selecione 12 fotos distintas e inspecione os originais e os JPEGs finais 800×600; rejeite pessoas, marcas, logos, textos e telas com conteúdo. Hash não substitui revisão visual.
O operador faz upload dos 12 JPEGs no bucket indicado, com leitura pública e escrita restrita, preservando os nomes `TI-0001.jpg` a `TI-0012.jpg`. Não usar hotlink permanente do Pixabay.
Confira cada URL pública e então copie somente o `manifest.json` aprovado para `public/equipment/manifest.json`; execute os checks antes de publicar a revisão.
Na repetição, mantenha objetos de mesmo hash; substitua fotos somente após nova aprovação. A [skill](skills/imagens-equipamentos/SKILL.md) prepara arquivos locais e não contém comando de upload.

## Conferência final pelo operador

1. Confira CI e build Vercel da revisão pretendida; abra `/api/health` e confirme 200 antes do fluxo de empréstimo.
2. Entre com uma conta própria com Membership em `suporte_ti`; confira os 12 itens, fotos, créditos e três estados do catálogo em `/app`.
3. Solicite item disponível; confira sucesso, indisponibilidade no catálogo e prazo em `/app/meus-emprestimos`, no horário de São Paulo.
4. Confira limite de três, recusa de manutenção/indisponível e bloqueio por atraso com dados de teste apropriados. ADMIN segue as mesmas regras pessoais.
5. Confira o acesso do professor como ADMIN e preserve zero empréstimos; registre os resultados reais no documento de entrega.

Login, catálogo, solicitação imediata e empréstimos próprios estão implementados. O CI executa testes, lint, verificação de tipos e build.
As fontes de comportamento são as specs [001](docs/specs/001-login), [002](docs/specs/002-dados-iniciais) e [003](docs/specs/003-solicitar-emprestimo). Status e evidências ficam em [ENTREGA.md](ENTREGA.md) e [handoff.md](handoff.md).
Devolução e painel de Operações pertencem ao MVP maior, fora da fatia desta prática. RLS deny-by-default complementa a autorização obrigatória no servidor.
