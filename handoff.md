# Handoff — Auth, Storage e produção, 11/11/2026

- Tarefa: concluir a configuração publicada do professor, imagens e acesso autenticado.
- Branch codex/tela-inicial; main e tag entrega-pratica publicadas em 8f76cd6; registro desta operação segue em commit documental separado.
- Origem própria: https://github.com/Kogake7/projeto_vibecoding_emprestimos; não alterar repositórios dos colegas.
- Produção: https://projeto-vibecoding-emprestimos.vercel.app; Vercel dmitri8/projeto-vibecoding-emprestimos, build READY.
- Supabase elyivfytdbplvnfxhpqw: duas migrations existentes aplicadas, tenant suporte_ti e inventário exato de 12 itens.
- Conta do professor criada pela API Auth, confirmada e vinculada como ADMIN pelo script existente; zero empréstimos confirmado por consulta SQL e API.
- Bucket equipment criado via Storage API: leitura pública, somente image/jpeg, limite 2 MB; nenhuma policy de escrita para clientes.
- Doze JPEGs publicados; todos os GETs anônimos retornaram 200 e SHA-256 idêntico ao manifesto versionado.
- Nove verificações HTTPS aprovadas: login real, cookie Secure/HttpOnly, ADMIN, catálogo 12/9/3, zero empréstimos, páginas autenticadas, redirects anônimos e API protegida.
- Evidência sanitizada: docs/evidencias/producao-20261111.json. HTTP não substitui observação visual dos estados dinâmicos.
- CI 42992919261 e 42996724959 aprovados para código; esta alteração é documental, sem necessidade de repetir a suíte.
- Operações remotas foram delegadas expressamente pelo usuário; não alegar execução manual humana.
- Chave de serviço e senha do enunciado apenas em arquivos privados fora do repositório; nenhum segredo novo no runtime ou Git.
- Nenhum empréstimo criado para o professor, nenhuma migration, reset, alteração de ADR ou policy executada.
- Não mover a tag existente nem forçar push; publicar a documentação em main por fast-forward.
- Próximo passo: conferir visualmente o catálogo e os estados dinâmicos com uma identidade própria, preservando zero empréstimos do professor.
