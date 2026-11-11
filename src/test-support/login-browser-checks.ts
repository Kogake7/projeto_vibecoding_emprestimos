import assert from "node:assert/strict";

// Harness do navegador conectado: usa exclusivamente sua API Playwright documentada.
// Não exige instalação de @playwright/test e não integra a suíte CLI do Vitest.
interface Locator {
  fill(value: string): Promise<void>;
  click(): Promise<void>;
  waitFor(options: { state: "visible"; timeoutMs: number }): Promise<void>;
  evaluate<T>(callback: (element: Element) => T): Promise<T>;
}
interface BrowserHarness {
  goto(url: string): Promise<void>;
  reload(): Promise<void>;
  url(): Promise<string | undefined>;
  playwright: {
    getByRole(
      role: string,
      options: { name: string; exact?: boolean },
    ): Locator;
    getByText(text: string, options: { exact: boolean }): Locator;
    waitForURL(url: string, options: { timeoutMs: number }): Promise<void>;
  };
}

export async function runLoginBrowserChecks(
  tab: BrowserHarness,
  origin: string,
  password: string,
) {
  assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const results: { test: string; status: "PASSED"; url: string | undefined }[] =
    [];
  const email = () =>
    tab.playwright.getByRole("textbox", { name: "E-mail", exact: true });
  const secret = () =>
    tab.playwright.getByRole("textbox", { name: "Senha", exact: true });
  async function resetLogin() {
    if ((await tab.url()) === `${origin}/login`) await tab.reload();
    else await tab.goto(`${origin}/login`);
  }
  async function submit(address: string, value: string) {
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
    assert.equal(
      await tab.url(),
      `${origin}/login`,
      "CA-02 deve permanecer no login",
    );
    assert.equal(
      await secret().evaluate(
        (element) => (element as HTMLInputElement).value === "",
      ),
      true,
      "CA-02 deve limpar a senha após falha",
    );
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
    assert.equal(
      await tab.url(),
      `${origin}/app`,
      "CA-01 deve navegar à área protegida",
    );
    results.push({
      test: `CA-01 formulário autentica e redireciona: ${role}`,
      status: "PASSED",
      url: await tab.url(),
    });
  }
  return results;
}
