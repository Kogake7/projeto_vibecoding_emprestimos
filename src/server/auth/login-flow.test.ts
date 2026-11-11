import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLoginFixture } from "../../test-support/login-fixture";
import { LOGIN_FAILURE } from "../../shared/login";

describe("login e sessão via HTTP Next + SDK SSR + PostgreSQL local", () => {
  let fixture: Awaited<ReturnType<typeof createLoginFixture>>;
  beforeAll(async () => {
    fixture = await createLoginFixture();
  }, 120_000);
  afterAll(async () => {
    await fixture?.dispose();
  }, 30_000);

  function updateJar(response: Response, jar: Map<string, string>) {
    for (const cookie of response.headers.getSetCookie()) {
      const first = cookie.split(";")[0];
      const at = first.indexOf("=");
      if (/max-age=0/i.test(cookie)) jar.delete(first.slice(0, at));
      else jar.set(first.slice(0, at), first.slice(at + 1));
    }
  }
  function cookieHeader(jar: Map<string, string>) {
    return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  }
  async function login(
    email: string,
    password: string = fixture.password,
    extra: object = {},
  ) {
    return fetch(`${fixture.origin}/api/trpc/auth.login`, {
      method: "POST",
      headers: { Origin: fixture.origin, "Content-Type": "application/json" },
      body: JSON.stringify({ json: { email, password, ...extra } }),
    });
  }

  it.each(["COLLABORATOR", "ADMIN"] as const)(
    "CA-01 CA-07 inicia sessão de %s e aponta para área protegida",
    async (role) => {
      const user = await fixture.addUser(
        `${role.toLowerCase()}@example.test`,
        role,
      );
      const response = await login(user.email);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(JSON.parse(body)).toEqual({
        result: { data: { json: { redirectTo: "/app" } } },
      });
      expect(body).not.toMatch(/access_token|refresh_token|password/);
      const jar = new Map<string, string>();
      updateJar(response, jar);
      expect(jar.size).toBeGreaterThan(0);
      for (const cookie of response.headers.getSetCookie()) {
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Lax/i);
        expect(cookie).toMatch(/; Secure/i);
      }
      const me = await fetch(`${fixture.origin}/api/trpc/auth.me`, {
        headers: { Cookie: cookieHeader(jar) },
      });
      expect(me.status).toBe(200);
      expect(await me.json()).toMatchObject({
        result: { data: { json: { userId: user.id, role } } },
      });
      const page = await fetch(`${fixture.origin}/app`, {
        headers: { Cookie: cookieHeader(jar) },
        redirect: "manual",
      });
      expect(page.status).toBe(200);
    },
    60_000,
  );

  it("CA-02 email inexistente e senha incorreta têm a mesma resposta genérica sem cookie novo", async () => {
    const existing = await fixture.addUser(
      "invalid@example.test",
      "COLLABORATOR",
    );
    const wrong = await login(existing.email, "fixture-wrong");
    const absent = await login("absent@example.test", "fixture-wrong");
    expect(wrong.status).toBe(401);
    expect(absent.status).toBe(401);
    expect(await wrong.json()).toEqual(await absent.json());
    expect(wrong.headers.getSetCookie()).toHaveLength(0);
    const retry = await login(existing.email, "fixture-wrong");
    expect(await retry.text()).toContain(LOGIN_FAILURE);
  }, 60_000);

  it("CA-03 página protegida sem sessão redireciona ao login, inclusive subcaminho", async () => {
    for (const path of ["/app", "/app/direto"]) {
      const response = await fetch(`${fixture.origin}${path}`, {
        redirect: "manual",
        headers: { "x-user-id": "fixture-forged", "x-role": "ADMIN" },
      });
      expect(response.status).toBe(307);
      expect(
        new URL(response.headers.get("Location")!, fixture.origin).href,
      ).toBe(`${fixture.origin}/login`);
    }
    const invalid = await fetch(`${fixture.origin}/app`, {
      redirect: "manual",
      headers: { Cookie: "sb-127-auth-token=base64-e30" },
    });
    expect(invalid.status).toBe(307);
    expect(
      new URL(invalid.headers.get("Location")!, fixture.origin).pathname,
    ).toBe("/login");
  }, 60_000);

  it("CA-04 renova sessão expirada no proxy e mantém tokens só em cookie httpOnly", async () => {
    const user = await fixture.addUser("refresh@example.test", "COLLABORATOR");
    const response = await login(user.email);
    const jar = new Map<string, string>();
    updateJar(response, jar);
    const name = [...jar.keys()].find((name) => name.endsWith("-auth-token"))!;
    expect(Boolean(name)).toBe(true);
    const session = JSON.parse(
      Buffer.from(jar.get(name)!.slice("base64-".length), "base64url").toString(
        "utf8",
      ),
    );
    session.expires_at = Math.floor(Date.now() / 1000) - 60;
    jar.set(
      name,
      `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
    );
    const before = fixture.renewals();
    const page = await fetch(`${fixture.origin}/app`, {
      headers: { Cookie: cookieHeader(jar) },
      redirect: "manual",
    });
    expect(page.status).toBe(200);
    expect(fixture.renewals()).toBe(before + 1);
    expect(page.headers.get("Cache-Control")).toContain("no-store");
    for (const cookie of page.headers.getSetCookie())
      expect(cookie).toMatch(/HttpOnly/i);
    expect(page.headers.getSetCookie().length).toBeGreaterThan(0);
    updateJar(page, jar);
    // Cabeçalhos internos do proxy também não podem expor o cookie ao JS.
    const readableHeaders = [...page.headers]
      .filter(([name]) => name !== "set-cookie")
      .map(([, value]) => value)
      .join("\n");
    for (const value of jar.values())
      expect(readableHeaders.includes(value)).toBe(false);
    const html = await page.text();
    expect(html.includes(session.access_token)).toBe(false);
    expect(html.includes(session.refresh_token)).toBe(false);
    const me = await fetch(`${fixture.origin}/api/trpc/auth.me`, {
      headers: { Cookie: cookieHeader(jar) },
    });
    expect(me.status).toBe(200);
    expect(fixture.renewals()).toBe(before + 1);
  }, 60_000);

  it("CA-05 CA-06 credencial válida sem suporte_ti não publica a sessão", async () => {
    const user = await fixture.addUser(
      "other@example.test",
      undefined,
      "ADMIN",
    );
    const response = await login(user.email);
    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toHaveLength(0);
    expect(await response.text()).toContain("Acesso não permitido.");
  }, 60_000);

  it("CA-02 CA-07 rejeita campos de identidade e protege login contra CSRF", async () => {
    const user = await fixture.addUser("csrf@example.test", "COLLABORATOR");
    expect(
      (
        await login(user.email, fixture.password, {
          role: "ADMIN",
          tenantId: "fixture-forged",
        })
      ).status,
    ).toBe(400);
    for (const origin of ["https://external.example", undefined]) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (origin) headers.Origin = origin;
      const response = await fetch(`${fixture.origin}/api/trpc/auth.login`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          json: { email: user.email, password: fixture.password },
        }),
      });
      expect(response.status).toBe(403);
      expect(response.headers.getSetCookie()).toHaveLength(0);
    }
  }, 60_000);
});
