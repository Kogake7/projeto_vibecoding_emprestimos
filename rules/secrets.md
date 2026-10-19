# Variáveis de ambiente e chaves

> Leitor: agente

## Quando

Ao criar ou usar variável de ambiente, cliente Supabase ou código de configuração.

## Procedimento

1. Somente a chave pública `anon` pode alcançar o navegador.
2. Chaves de serviço ficam em código marcado `server-only`, nunca com prefixo `NEXT_PUBLIC_`.
3. Toda variável nova deve constar no ambiente local, em `.env.example` sem valor real e na Vercel em Preview/Production.
4. Informe no feedback quais desses locais foram atualizados e quais dependem do operador.

## Verificação

`rg -n "service_role|SUPABASE_SERVICE" src` não encontra segredo no cliente, e `.env.example` cobre todas as variáveis lidas pelo código.
