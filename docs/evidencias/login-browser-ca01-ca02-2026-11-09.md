# Testes executáveis de navegador — CA-01 e CA-02

O principal executou o módulo compilado abaixo no harness CUA conectado, passando a aba de teste e a fixture local. Não são observações guiadas: a função automatiza preenchimento, clique, espera por mensagem/URL/perfil e usa assert estrito. Qualquer falha lança exceção e impede retorno PASSED. Não são testes do Vitest nem de CI; são quatro testes adicionais executados pelo navegador existente. O verificador analisa as fontes e resultados, sem executá-los pessoalmente.

Fonte: [login-browser-checks.ts](../../src/test-support/login-browser-checks.ts). Módulo executado: [MJS](login-browser-checks-2026-11-09.mjs), gerado por typescript.transpileModule com target ES2022/module ESNext, sem alteração manual. A função só aceita origem HTTP 127.0.0.1 com porta explícita. O provedor de teste e o banco foram encerrados após os casos. Nenhuma conta real foi usada.

## Chamada executada no navegador

```js
const module = await import("file:///CAMINHO_ABSOLUTO/docs/evidencias/login-browser-checks-2026-11-09.mjs");
const results = await module.runLoginBrowserChecks(tab, "http://127.0.0.1:51233", "fixture-browser-only");
nodeRepl.write(results);
```

O caminho foi o absoluto real do workspace. O valor de senha nessa chamada pertence somente ao provedor sintético criado por scripts/login-preview.ts.

## Resultado recebido e hashes da execução

```json
{
  "runner": "CUA conectado; API Playwright existente, sem instalar pacote",
  "testSource": "src/test-support/login-browser-checks.ts",
  "executedModule": "docs/evidencias/login-browser-checks-2026-11-09.mjs",
  "typescript": "5.9.3",
  "environment": "Next production local + SDK SSR real + Auth controlado loopback + PostgreSQL descartável",
  "origin": "http://127.0.0.1:51233",
  "resultOrigin": "Saída real de runLoginBrowserChecks recebida pelo principal via cua_repl; quatro asserts/casos concluídos sem exceção.",
  "results": [
    {
      "test": "CA-02 mensagem genérica e permanência: senha incorreta",
      "status": "PASSED",
      "url": "http://127.0.0.1:51233/login"
    },
    {
      "test": "CA-02 mensagem genérica e permanência: e-mail inexistente",
      "status": "PASSED",
      "url": "http://127.0.0.1:51233/login"
    },
    {
      "test": "CA-01 formulário autentica e redireciona: Administrador",
      "status": "PASSED",
      "url": "http://127.0.0.1:51233/app"
    },
    {
      "test": "CA-01 formulário autentica e redireciona: Colaborador",
      "status": "PASSED",
      "url": "http://127.0.0.1:51233/app"
    }
  ],
  "sourceHashes": {
    "src/test-support/login-browser-checks.ts": "afbf65182f8c87b33aa3806c21d3a893b2707ae43891797e77719f9995b44554",
    "docs/evidencias/login-browser-checks-2026-11-09.mjs": "c0706c2d1748881b8534fe6881d61ce06a819ec60f5c16338ae9201d8132e9ee",
    "src/components/login-screen.tsx": "63696fe42c4482753085ef6d582f36f4c2db77366cbb0274a35c5a149f0e1df6",
    "src/components/access-screen.tsx": "55afba17649a233db6b57624646b15456f6d82ac11f959c89c64eae6b69591e0",
    "src/trpc/react.tsx": "7bd7a554b0b26bc3af5adf4c07b108380aeefe9dda2c6439f7d842ea9d25bbde",
    "src/shared/login.ts": "6e993eadb6b3e4ae0d741f324172a7fd604edebe81155366b04f2d5e08b2b796",
    "src/components/login-screen.test.tsx": "dff7f1241074acd4111ca7a6901bdda9933bba4ad62ee075552c4d713eed0092"
  }
}
```

## Código MJS realmente executado

```js
import assert from "node:assert/strict";
export async function runLoginBrowserChecks(tab, origin, password) {
    assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
    const results = [];
    const email = () => tab.playwright.getByRole("textbox", { name: "E-mail", exact: true });
    const secret = () => tab.playwright.getByRole("textbox", { name: "Senha", exact: true });
    async function resetLogin() {
        if ((await tab.url()) === `${origin}/login`)
            await tab.reload();
        else
            await tab.goto(`${origin}/login`);
    }
    async function submit(address, value) {
        await email().fill(address);
        await secret().fill(value);
        await tab.playwright
            .getByRole("button", { name: "Entrar", exact: true })
            .click();
    }
    for (const address of ["admin@example.test", "missing@example.test"]) {
        await resetLogin();
        await submit(address, "fixture-invalid");
        await tab.playwright
            .getByText("Não foi possível entrar. Verifique seu e-mail e senha.", {
            exact: true,
        })
            .waitFor({ state: "visible", timeoutMs: 10_000 });
        assert.equal(await tab.url(), `${origin}/login`, "CA-02 deve permanecer no login");
        assert.equal(await secret().evaluate((element) => element.value === ""), true, "CA-02 deve limpar a senha após falha");
        results.push({
            test: `CA-02 mensagem genérica e permanência: ${address === "admin@example.test" ? "senha incorreta" : "e-mail inexistente"}`,
            status: "PASSED",
            url: await tab.url(),
        });
    }
    for (const [address, role] of [
        ["admin@example.test", "Administrador"],
        ["collaborator@example.test", "Colaborador"],
    ]) {
        await resetLogin();
        await submit(address, password);
        await tab.playwright.waitForURL(`${origin}/app`, { timeoutMs: 10_000 });
        await tab.playwright
            .getByText("Acesso autorizado.", { exact: true })
            .waitFor({ state: "visible", timeoutMs: 10_000 });
        await tab.playwright
            .getByText(role, { exact: true })
            .waitFor({ state: "visible", timeoutMs: 10_000 });
        assert.equal(await tab.url(), `${origin}/app`, "CA-01 deve navegar à área protegida");
        results.push({
            test: `CA-01 formulário autentica e redireciona: ${role}`,
            status: "PASSED",
            url: await tab.url(),
        });
    }
    return results;
}

```
