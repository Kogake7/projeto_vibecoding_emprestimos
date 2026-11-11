import { describe, expect, it } from "vitest";
import { assertInitialDataTarget } from "./initial-data-target";

const project = "abcdefghijklmnopqrst";
const otherProject = "zyxwvutsrqponmlkjihgfe";
const direct = `postgresql://postgres:fixture-only@db.${project}.supabase.co:5432/postgres`;

describe("Spec 002 CA-05 — confirmação do destino antes da conexão", () => {
  it.each([
    [{}, direct],
    [{ apply: false, confirmTarget: project }, direct],
    [{ apply: true }, direct],
    [{ apply: true, confirmTarget: project }, undefined],
    [{ apply: true, confirmTarget: otherProject }, direct],
    [{ apply: true, confirmTarget: project }, "invalid-url"],
    [
      { apply: true, confirmTarget: project },
      `https://db.${project}.supabase.co/postgres`,
    ],
    [
      { apply: true, confirmTarget: project },
      `postgresql://db.${project}.supabase.co.attacker.example/postgres`,
    ],
    [
      { apply: true, confirmTarget: "10.0.0.1" },
      "postgresql://postgres:fixture-only@10.0.0.1/db",
    ],
    [
      { apply: true, confirmTarget: project },
      `postgresql://postgres.${project}@pooler.supabase.com/postgres`,
    ],
    [
      { apply: true, confirmTarget: project },
      `postgresql://other.${project}@aws-0-sa-east-1.pooler.supabase.com/postgres`,
    ],
    [
      { apply: true, confirmTarget: project },
      `postgresql://postgres.${otherProject}@aws-0-sa-east-1.pooler.supabase.com/postgres`,
    ],
  ])("recusa confirmação, protocolo ou alvo inválido %#", (options, url) => {
    expect(() => assertInitialDataTarget(options, url)).toThrow(
      "Confirme o alvo",
    );
  });

  it.each(["127.0.0.1", "localhost", "[::1]"])(
    "aceita somente o loopback confirmado %s",
    (hostname) => {
      expect(
        assertInitialDataTarget(
          { apply: true, confirmTarget: hostname },
          `postgres://postgres:fixture-only@${hostname}:5432/test`,
        ),
      ).toBe(hostname);
      expect(() =>
        assertInitialDataTarget(
          { apply: true, confirmTarget: "outro" },
          `postgres://postgres@${hostname}:5432/test`,
        ),
      ).toThrow("Confirme o alvo");
    },
  );

  it("aceita conexão direta e pooler apenas com a referência exata", () => {
    expect(
      assertInitialDataTarget({ apply: true, confirmTarget: project }, direct),
    ).toBe(project);
    expect(
      assertInitialDataTarget(
        { apply: true, confirmTarget: project },
        `postgresql://postgres.${project}:fixture-only@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
      ),
    ).toBe(project);
    expect(
      assertInitialDataTarget(
        { apply: true, confirmTarget: project },
        `postgresql://postgres%2E${project}@aws-0-sa-east-1.pooler.supabase.com/postgres`,
      ),
    ).toBe(project);
  });

  it("mensagem de recusa não revela URL, usuário ou senha", () => {
    const url =
      "postgresql://fixture-private-user:fixture-private-password@wrong.example/test";
    try {
      assertInitialDataTarget({ apply: true, confirmTarget: project }, url);
      throw new Error("A guarda deveria recusar o alvo.");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const message = error instanceof Error ? error.message : "";
      expect(message).toContain("Confirme o alvo");
      expect(message).not.toMatch(/fixture-private|wrong\.example|postgresql:/);
    }
  });
});
