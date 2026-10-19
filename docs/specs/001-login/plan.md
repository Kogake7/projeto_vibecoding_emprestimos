# Plano 001 — Login por e-mail e senha

## Direção técnica

A implementação segue o ADR-001: Next.js App Router, telas com Tailwind CSS,
sessão Supabase mantida no servidor com `@supabase/ssr` e acesso a dados de
domínio somente por tRPC. Nenhuma credencial, token ou chave de serviço deve
chegar ao cliente.

## Etapas

1. Criar a tela responsiva em `/login`, com campos de e-mail e senha, mensagem
   de acesso restrito e sem cadastro ou recuperação de senha (CA-08).
2. Integrar o envio do formulário ao fluxo server-side do Supabase Auth,
   mantendo mensagens de erro genéricas (CA-01 e CA-02).
3. Implementar renovação de sessão e proteção de rotas (CA-03 e CA-04).
4. Resolver membership, tenant e papel no contexto tRPC e cobrir isolamento e
   autorização (CA-05, CA-06 e CA-07).

## Compatibilidade e segurança

- Preservar `/` e `/api/health`, que comprovam o andar zero.
- Não alterar schema nem migrations para a autenticação.
- Não expor token ao JavaScript e não criar autenticação simulada.
- Validar cada etapa conforme `rules/checks.md`.
