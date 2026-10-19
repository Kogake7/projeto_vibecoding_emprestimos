# ADR-002 — Design system

- **Status:** aceito
- **Data:** 2026-10-02
- **Escopo:** interface web do sistema de empréstimo de equipamentos

## Contexto

O produto precisa manter uma linguagem visual coerente entre o catálogo, os
empréstimos do colaborador, a devolução de itens e as telas de Operações. O
ADR-001 definiu Tailwind CSS para estilização e shadcn/ui como base para
componentes incorporados ao repositório, mas deixou tokens e identidade visual
fora de seu escopo.

As primeiras referências implementadas estão em:

- `src/app/layout.tsx`, com idioma `pt-BR` e metadados do produto;
- `src/app/globals.css`, com tema claro, tipografia de sistema e cores globais;
- `src/app/page.tsx`, com a página de apresentação e os estados de saúde do
  ambiente;
- `src/app/login/page.tsx`, com a composição responsiva, formulário e marca do
  produto.

Esses arquivos já estabelecem uma direção visual. Sem uma decisão explícita,
novas telas tenderiam a repetir valores arbitrários ou introduzir variações
incompatíveis.

## Decisão

Adotar um design system leve, implementado no próprio repositório e orientado
por tokens semânticos. Tailwind CSS continua sendo a camada de estilização, e
componentes shadcn/ui podem ser incorporados quando reduzirem trabalho sem
impor uma identidade visual diferente.

O sistema visual deve preservar os padrões abaixo.

### Identidade e tom

- A marca textual é **SUPORTE TI**, acompanhada de **Equipamentos internos**
  quando houver espaço.
- O tom é institucional, direto e acolhedor. Textos devem explicar a próxima
  ação sem jargão técnico.
- A interface usa exclusivamente tema claro nesta versão. Tema escuro não faz
  parte desta decisão.
- Ícones são lineares, simples e usados com texto ou nome acessível; não
  substituem sozinhos informações essenciais.

### Cores

As famílias `teal` e `slate` do Tailwind são a base da interface. Os papéis
semânticos são:

| Papel                      | Referência atual                | Uso                               |
| -------------------------- | ------------------------------- | --------------------------------- |
| Marca e ação primária      | `teal-700`                      | botões, links, destaques e foco   |
| Fundo institucional escuro | `#0b3b3c`                       | painéis de marca e comunicação    |
| Fundo da aplicação         | `slate-50` / `#f4f6f8`          | páginas e áreas neutras           |
| Superfície                 | `white`                         | cards, campos e mensagens         |
| Texto principal            | `slate-950` / `#172d38`         | títulos e conteúdo de alta ênfase |
| Texto secundário           | `slate-500` a `slate-600`       | descrições e apoio                |
| Borda                      | `slate-200`                     | divisões, cards e controles       |
| Sucesso                    | `emerald-100` com `emerald-900` | estados positivos                 |
| Atenção                    | `amber-100` com `amber-900`     | pendências e indisponibilidade    |

Cores devem comunicar um papel semântico, não apenas decorar. Estados de
erro, sucesso ou atenção também precisam de texto ou ícone; cor isolada não é
suficiente. Novos valores hexadecimais só devem ser introduzidos quando a
paleta do Tailwind não representar o papel necessário.

### Tipografia

- A fonte é a pilha de sistema `Arial, Helvetica, sans-serif`; não há fonte
  externa nem dependência de download para renderizar a interface.
- Títulos usam peso `semibold` ou `bold`, entrelinha compacta e tracking
  reduzido quando necessário.
- Texto corrido usa peso regular, contraste secundário e entrelinha confortável.
- Rótulos, badges e marcadores podem usar caixa alta e tracking ampliado, mas
  não o corpo de texto.
- A hierarquia deve partir das escalas do Tailwind; valores arbitrários ficam
  restritos aos casos já justificados pelo layout.

### Espaçamento, formas e elevação

- Espaçamento segue a escala do Tailwind, com `4`, `6`, `8`, `10`, `12` e `16`
  como intervalos recorrentes nas composições atuais.
- Controles de formulário têm altura mínima de `3.25rem` (`h-13`) e área de
  interação confortável.
- Campos, botões e mensagens usam preferencialmente `rounded-xl`; cards de
  conteúdo podem usar `rounded-2xl`; badges usam `rounded-full`.
- Bordas discretas separam superfícies. Sombras são leves e reservadas para
  ações primárias, marca ou elementos que precisam de elevação.
- Larguras de leitura são limitadas com `max-w-*`; textos longos não devem
  ocupar toda a largura da viewport.

### Layout responsivo

- A construção parte de telas pequenas e progride com os breakpoints padrão
  do Tailwind.
- Conteúdo principal usa padding lateral compacto em telas pequenas e aumenta
  progressivamente em `sm`, `lg` e `xl`.
- A tela de autenticação mostra somente o fluxo essencial em telas pequenas.
  O painel institucional lateral aparece a partir de `lg`, sem esconder
  informação necessária para concluir a tarefa.
- Grids devem colapsar para uma coluna antes de ganhar colunas adicionais; o
  layout não pode depender de largura desktop para funcionar.

### Componentes e estados

Os primeiros componentes reutilizáveis a consolidar são:

- marca do produto;
- botão primário;
- campo de formulário com rótulo, ícone, ajuda e erro;
- badge de estado;
- card de conteúdo;
- mensagem informativa;
- estado vazio, carregando e erro.

Componentes copiados do shadcn/ui devem ser adaptados a estes tokens e mantidos
no repositório. Uma tela não deve criar uma segunda versão visual de um
componente quando o papel e o comportamento forem os mesmos.

Estados interativos devem cobrir, conforme aplicável: padrão, hover, foco,
ativo, desabilitado, carregando, sucesso e erro. O foco por teclado deve ser
visível, seguindo a referência atual de borda `teal-600` e anel translúcido.
Desabilitado deve continuar legível e não depender apenas de redução de
opacidade para explicar o motivo.

### Acessibilidade

- O documento permanece em `pt-BR`.
- Toda entrada possui `label` associado; instruções e erros usam
  `aria-describedby` quando necessário.
- SVGs decorativos usam `aria-hidden="true"`; ícones acionáveis recebem nome
  acessível.
- A ordem visual preserva a ordem de leitura e navegação por teclado.
- Texto e controles devem atingir contraste compatível com WCAG 2.2 AA.
- Movimento não é requisito da identidade; qualquer animação futura deve
  respeitar `prefers-reduced-motion`.

## Organização da implementação

- Tokens globais e estilos de base pertencem a `src/app/globals.css`.
- Variações semânticas devem ser centralizadas antes que o mesmo conjunto de
  classes seja repetido em mais de uma tela.
- Componentes compartilhados devem ficar em `src/components/ui` quando forem
  primitivos visuais e em `src/components` quando carregarem linguagem de
  domínio.
- Páginas são responsáveis pela composição, não por redefinir tokens ou
  duplicar primitivos.
- Valores atuais podem ser migrados gradualmente para tokens sem alterar o
  resultado visual das telas existentes.

## Alternativas consideradas

### Usar classes Tailwind diretamente em cada tela, sem design system

Descartada porque acelera a primeira tela, mas multiplica combinações de cor,
espaçamento e estado à medida que o produto cresce.

### Adotar uma biblioteca com identidade visual fechada

Descartada pelo ADR-001. Componentes com aparência própria dificultariam
preservar a linguagem visual existente e aumentariam o custo de customização.

### Criar um pacote separado de design system

Descartada neste momento. Existe uma única aplicação e um único repositório;
um pacote versionado adicionaria processo sem consumidor independente.

### Carregar uma fonte externa

Descartada para a primeira versão. A pilha de sistema reduz dependências,
latência e risco de falha de carregamento sem comprometer a hierarquia atual.

## Consequências

**Benefícios**

- Novas telas partem de uma linguagem visual e de interação comum.
- Estados de componentes tornam-se previsíveis para colaboradores e
  Operações.
- Acessibilidade e responsividade deixam de depender de decisões isoladas por
  página.
- A implementação continua local, compatível com Tailwind e customizável.

**Custos e riscos**

- Os estilos atuais ainda estão distribuídos nas páginas e precisarão ser
  consolidados gradualmente.
- Manter componentes locais exige disciplina para evitar cópias quase iguais.
- A paleta atual ainda não demonstra todos os estados necessários, especialmente
  erro destrutivo e informação neutra; esses papéis devem ser definidos quando
  aparecerem em uma funcionalidade concreta.

## Fora de escopo

- Logotipo definitivo ou manual de marca institucional.
- Tema escuro.
- Biblioteca de ilustrações ou fotografia.
- Animações de marca.
- Pacote publicável para outras aplicações.
- Implementação imediata de todos os componentes listados.
