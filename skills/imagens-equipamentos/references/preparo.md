# Contrato do preparo local

Pré-requisito: Python 3 e Pillow. A chave fica em arquivo texto ou JSON fora do
repositório, com acesso somente do usuário. Cache, originais e pacote final
também ficam fora do Git. Não há comando de upload.

Os exemplos usam caminhos escolhidos pelo operador; trocar os nomes entre
`<...>` antes de executar. Nenhum exemplo contém credencial real.

Após o operador salvar a chave como texto em
`C:/Users/dmitrikogake-ieg/pixabay.key`, este comando busca o inventário fixo,
reaproveitando os termos de `src/shared/equipment-inventory.json` e o cache:

```powershell
python skills/imagens-equipamentos/scripts/prepare_images.py search-inventory --credentials-file 'C:/Users/dmitrikogake-ieg/pixabay.key' --work-dir 'C:/Users/dmitrikogake-ieg/AppData/Local/Temp/empresti-pixabay'
```

```powershell
python skills/imagens-equipamentos/scripts/prepare_images.py search --credentials-file '<arquivo-local-externo.json>' --work-dir '<pasta-local-externa>' --query 'laptop isolated'
python skills/imagens-equipamentos/scripts/prepare_images.py download --work-dir '<pasta-local-externa>' --photo-id 123
python skills/imagens-equipamentos/scripts/prepare_images.py prepare --work-dir '<pasta-local-externa>' --selection '<selecao.json>' --output-dir '<pacote-local-externo>' --public-base-url 'https://<projeto>.supabase.co/storage/v1/object/public/<bucket>/'
python skills/imagens-equipamentos/scripts/prepare_images.py finalize --package-dir '<pacote-local-externo>' --reviews '<revisoes.json>'
python skills/imagens-equipamentos/scripts/prepare_images.py validate --package-dir '<pacote-local-externo>'
```

## Seleção e revisão

`search` salva resultados em cache fora do repositório; nunca salva a chave.
`download` baixa uma única foto selecionada do cache válido e informa o arquivo
e SHA-256. Fotografias devem ter largura mínima 800 e altura mínima 600.
Inspecionar primeiro o original; o preparo preserva o enquadramento completo.

O JSON da seleção é um array de doze objetos:

```json
[
  {
    "assetTag": "TI-0001",
    "photoId": 123,
    "alt": "Imagem ilustrativa de notebook de 14 polegadas",
    "sourceSha256": "<sha256-do-original-inspecionado>"
  }
]
```

Não reutilizar photoId, SHA do original ou SHA final. Há dois notebooks com
mesmo nome e unidades diferentes; escolher fotos diferentes para ambos.
Somente TI-0007 admite os campos opcionais crop=[esquerda,topo,direita,baixo]
e cropReason: na rodada atual, a foto 5999978 usa [0,0,1280,760] para excluir
apenas o caderno com texto do primeiro plano, mantendo o monitor inteiro.
As coordenadas usam o original após orientação EXIF; não há retoque. A decisão
é técnica do agente, sob a autorização ampla de 11/11, e foi registrada antes
de finalize. A licença oficial permite adaptação; nenhuma permissão de um
repositório alheio foi importada. Registrar sourceSha256 e sha256 final.
`prepare` valida toda a seleção antes de escrever, gera JPEGs com nomes
`TI-0001.jpg` até `TI-0012.jpg` e `manifest.draft.json`, com revisão pendente.
Não copia arquivos para o projeto nem para o Storage. Reexecução com os mesmos
bytes produz os mesmos JPEGs e hashes.

Depois de abrir os **doze arquivos finais**, escrever um array de revisões:

```json
[
  {
    "assetTag": "TI-0001",
    "sha256": "<sha256-do-jpeg-final-inspecionado>",
    "reviewer": "<quem-inspecionou>",
    "reviewedAt": "2026-11-11T03:00:00Z",
    "approved": true,
    "checks": {
      "people": false,
      "brands": false,
      "logos": false,
      "text": false,
      "screenContent": false
    }
  }
]
```

Os booleanos indicam presença do problema. Registrar também fotos reprovadas
em `rejections`, array opcional do arquivo de revisões, com photoId, motivo e
instante real nos campos photoId, reason e reviewedAt. Nesse caso o arquivo tem forma
`{"reviews":[...],"rejections":[...]}`. Não inventar rejeições.
`finalize` exige doze aprovações explícitas, datas válidas e os hashes exatos,
depois gera `manifest.json` e `review-log.json`. O log preserva as revisões
reais informadas; o script não reconhece pessoas ou marcas automaticamente.

## Manifesto consumido pela aplicação

O arquivo `manifest.json` tem `version: 1`, `provider: "pixabay"` e `images`.
Cada entrada contém assetTag, src (URL pública do Storage), alt, photoId,
sourceUrl (página da foto), photographer, photographerUrl, licenseUrl,
sourceSha256, sha256, width=800, height=600, reviewedAt, reviewer e
reviewApproved=true. A entrada de TI-0007 também registra crop e cropReason.
São metadados públicos; a chave da API nunca integra esse contrato.

O helper `src/shared/equipment-images.ts` lê o manifesto versionado em
`public/equipment/manifest.json`. Uma foto ausente retorna undefined e a UI
identifica a pendência. Um manifesto vazio não comprova a entrega das imagens.

## Publicação pelo operador

1. Executar `validate` no pacote aprovado.
2. Usar um bucket do Supabase com leitura pública e upload restrito ao
   operador; não fornecer chave service_role ao preparo.
3. Fazer upload dos doze JPEGs com os nomes do patrimônio. Na repetição,
   comparar hashes: manter objeto idêntico; substituir somente quando a
   troca da foto tiver sido aprovada e documentada.
4. Abrir cada src e conferir status 200, JPEG e dimensões. O script local não
   escreve no bucket nem verifica que o operador fez upload.
5. Os JPEGs locais aprovados e o manifesto podem ser versionados antes do
   upload. Nesse estágio, src é **destino Storage preparado**; aprovação dos
   bytes locais não comprova que os objetos existam ou respondam com sucesso.
   Registrar essa pendência e executar os checks locais. Após a publicação
   humana, conferir os doze GETs, crédito e correspondência foto/patrimônio na
   tela antes de declarar a entrega das imagens no ambiente publicado. Não
   substituir src por URL local para encobrir pendência do Storage.

## Verificação do preparo

```powershell
python -m unittest discover -s skills/imagens-equipamentos/scripts -p 'test_*.py' -v
```

Os testes usam imagens sintéticas temporárias **somente como fixtures de
teste**. Elas não são exportadas como fotos do inventário. Os testes provam
transformação, unicidade, hashes, revisão, cache e recusa de upload/segredos;
a inspeção das fotos reais continua indispensável.
