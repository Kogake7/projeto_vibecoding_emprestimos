import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TRPCProvider } from "../trpc/react";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
import LoginScreen from "./login-screen";

describe("tela de entrada", () => {
  it("CA-02 não envia credenciais pela URL quando JavaScript não está disponível", () => {
    const html = renderToStaticMarkup(
      createElement(TRPCProvider, null, createElement(LoginScreen)),
    );
    const form = html.match(/<form\b[^>]*>/)?.[0];
    expect(form).toMatch(/method="post"/);
  });
  it("CA-08 oferece somente entrada, sem ação pública de cadastro ou convite", () => {
    const html = renderToStaticMarkup(
      createElement(TRPCProvider, null, createElement(LoginScreen)),
    );
    const actions = [...html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)];

    expect(actions.length).toBeGreaterThan(0);
    for (const [, , content] of actions) {
      expect(content.replace(/<[^>]*>/g, "")).not.toMatch(
        /cadastr|criar conta|registr|convidar|enviar convite/i,
      );
    }
    expect(html).not.toMatch(
      /href="[^"]*(signup|sign-up|register|invite|cadastro)/i,
    );
    expect(html).toContain("Acesso exclusivo por convite.");
    expect(html.match(/<form\b/g)).toHaveLength(1);
    expect(
      [...html.matchAll(/<input\b[^>]*name="([^"]+)"/g)].map(
        (match) => match[1],
      ),
    ).toEqual(["email", "password"]);
  });
});
