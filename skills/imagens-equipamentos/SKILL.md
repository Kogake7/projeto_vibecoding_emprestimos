---
name: imagens-equipamentos
description: Buscar fotos de equipamentos na API Pixabay, preparar arquivos locais 800×600, revisar sua origem e aparência e gerar o pacote para upload humano no Storage. Use para o inventário EmpresTI; não gera imagens nem publica arquivos.
---

# Fotos dos equipamentos

## Decisões desta implementação

Em 11/11/2026, o operador autorizou concluir o escopo local, com decisões
conservadoras documentadas e sem aprovações intermediárias. Preservar a troca
confirmada para Pixabay, as doze unidades e o crédito visível na interface.
Preparar JPEG 800×600 com a foto inteira centralizada sobre fundo branco:
redimensionar proporcionalmente, sem ampliar, recortar ou distorcer. Esta é uma
decisão de implementação para manter a foto íntegra, não uma exceção ao contrato
visual. Rejeitar foto que não funcione assim.

Exceção técnica registrada antes da exportação final: somente TI-0007 pode
receber recorte natural mínimo de contexto externo, com caixa em pixels,
justificativa e hashes no manifesto. O enunciado não proíbe recorte e a
[licença permite adaptações](https://pixabay.com/service/license-summary/).
Na rodada de 11/11, o principal autorizou excluir o caderno com texto do
primeiro plano da foto 5999978, preservando o monitor completo. Isso é decisão
do agente sob a autorização ampla, não uma opinião atribuída ao operador.
Não apagar, pintar ou cobrir marcas; não reutilizar a mesma foto recortada.

Proveniência fica em manifesto versionado por patrimônio, sem mudança de
schema. A credencial de busca é arquivo local fora do repositório, recebido por
argumento; não é variável da aplicação nem segredo de runtime na Vercel.
Nenhum comando deste preparo aceita credencial de escrita ou faz upload.

## Preparar e conferir

Use Python 3 com Pillow já disponível. Não instalar ferramentas por efeito
colateral; se faltar Pillow, informar a dependência ao operador. O script é
[scripts/prepare_images.py](scripts/prepare_images.py); comandos e contratos
estão em [references/preparo.md](references/preparo.md).

1. Obter a chave em [Pixabay API](https://pixabay.com/api/docs/) com a conta do
   operador; ele salva texto puro ou JSON `{"apiKey":"valor real"}` fora do Git.
   Não pedir o valor no chat, abrir a chave em resposta ou gravá-la em logs.
2. Buscar candidatos por categoria com `search`. Mostrar origem e autor ao
   apresentar resultados; reaproveitar o cache de 24 horas.
3. Baixar somente candidatos selecionados com `download` e abrir as imagens
   locais para inspeção. Cada patrimônio precisa de foto e bytes distintos.
4. Gerar os doze JPEGs e o manifesto rascunho com `prepare`. Abrir cada arquivo
   **final** e reprovar pessoas, marcas, logos, textos ou telas com conteúdo.
   Buscar substituto quando necessário; registrar as rejeições reais.
5. Registrar a revisão dos bytes finais e executar `finalize` e `validate`.
   Hash e tamanho comprovam integridade, não substituem inspeção visual.
6. Entregar ao operador os JPEGs, manifesto e a lista de destinos. O operador
   faz upload idempotente no bucket público, sem tornar escrita pública. Os
   JPEGs locais aprovados e o manifesto podem ser versionados previamente em
   `public/equipment/`, com as URLs identificadas como **destinos preparados**.
   Isso não comprova upload nem sucesso remoto. Depois da publicação humana,
   conferir os doze GETs públicos antes de declarar as imagens publicadas e
   validadas. Manter os destinos Storage; não trocar silenciosamente por URLs
   locais para aparentar sucesso remoto.

Não confundir rascunho ou teste sintético com foto aprovada. Enquanto faltarem
chave, fotos ou revisão, manter o manifesto publicado vazio/parcial e registrar
a pendência. A interface oferece crédito “Fotos: Pixabay” com link e identifica
foto pendente; não inventa imagens ou proveniência para preencher os doze itens.

## Fontes e limites

Consultar [API oficial](https://pixabay.com/api/docs/) e
[licença](https://pixabay.com/service/license-summary/) antes do uso real.
O script limita buscas explícitas, mantém cache por 24 horas, usa somente GET
e baixa as imagens para hospedagem própria; não usa URLs CDN do Pixabay como
hotlink permanente. Crédito, autoria e revisão seguem também o contrato mais
restritivo da prática. Foto aprovada não deve ser apresentada como retrato da
unidade física real: é imagem ilustrativa do tipo de equipamento.
