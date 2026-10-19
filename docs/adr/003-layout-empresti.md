# ADR-003 — Layout EmpresTI

- **Status:** aceito por solicitação do operador em 2026-10-19.
- **Escopo:** apresentação da tela inicial e de `/login`.
- **Substitui:** identidade, tema e tipografia do ADR-002 neste escopo.

## Decisão

Usar a tela **01 Login** de [docs/layout.md](../layout.md) como referência
visual para `/` e `/login`: marca EmpresTI, tema escuro, composição dividida,
Open Sans, ícones Phosphor e ações contornadas. O operador pediu explicitamente
essa reprodução antes do novo envio ao GitHub.

O componente compartilhado fica em `src/components/login-screen.tsx`. Tokens,
reset e acessibilidade global ficam em `src/app/globals.css`; estilos de
composição permanecem em classes Tailwind no componente.

Fontes e ícones são servidos localmente por `next/font/local`, com arquivos e
licenças em `public/fonts`, para reproduzir a referência sem consultas a CDNs
durante a navegação ou o build. Os glifos usados vêm do Phosphor Web 2.1.1.

## Alternativas e consequências

Manter a identidade clara do ADR-002 foi descartado porque contraria a nova
referência indicada pelo operador. Carregar fontes por CDN foi descartado para
evitar dependência de rede na renderização.

Os assets locais aumentam o tamanho do repositório e suas licenças devem ser
preservadas. Esta decisão não implementa autenticação, catálogo nem dados
fictícios do documento de layout. A sessão segue pendente na spec 001; o botão
de envio permanece desabilitado e informa o motivo.

O health check existente permanece em `/api/health`, com seu estado apresentado
no rodapé da tela inicial.
