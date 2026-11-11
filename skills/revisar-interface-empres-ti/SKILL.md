---
name: revisar-interface-empres-ti
description: Orienta e revisa telas e componentes da interface EmpresTI contra a spec, os ADRs visuais e os tokens existentes. Use ao criar, alterar ou conferir UI deste projeto; não use para autenticação, regras de empréstimo ou banco.
---

# Revisar interface EmpresTI

## Antes de começar

Leia a spec da tela, `docs/adr/002-design-system.md` e os estilos existentes.
Para `/` e `/login`, leia também `docs/adr/003-layout-empresti.md`, que prevalece
no seu escopo, e a tela correspondente de `docs/layout.md`.

Se a tarefa não tiver spec aplicável ou critério de aceite que a cubra, pare e
informe a ausência; não invente comportamento para iniciar a revisão.

Se a referência exigir mudar uma decisão aceita, pare: não altere ADR como efeito
colateral da interface.

## Procedimento

1. Separe comportamento exigido pela spec de detalhe puramente visual.
2. Reutilize tokens semânticos de `src/app/globals.css`; introduza um token antes
   de repetir o mesmo valor arbitrário em mais de um componente.
3. Reutilize componentes e padrões existentes antes de criar uma segunda versão.
4. Cubra estados aplicáveis, foco visível, rótulos acessíveis, teclado e layout
   responsivo sem inventar comportamento ou dados.
5. Compare o resultado com a spec e a referência visual, registrando divergências
   concretas por arquivo e linha.

## Verificação

Execute os checks de `rules/checks.md`. Para mudança visual, confira ao menos as
larguras móvel e desktop e os estados vazio, carregando, erro e desabilitado que
forem aplicáveis à tela.

## Não faça

- Não implemente feature que a spec não pediu nem simule autenticação ou dados.
- Não copie regras, tokens ou decisões para esta skill; aponte para a fonte.
- Não carregue fonte, ícone ou asset remoto quando o projeto já o serve localmente.
