import type { CookieMethodsServer, CookieOptions } from "@supabase/ssr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SDKOptions = {
  cookieOptions?: CookieOptions;
  cookies: CookieMethodsServer;
};

const mocks = vi.hoisted(() => ({
  sdk: vi.fn<(url: string, key: string, options: SDKOptions) => void>(),
  getAll: vi.fn(() => [{ name: "sb-fixture-auth-token", value: "fixture" }]),
  set: vi.fn<(name: string, value: string, options: CookieOptions) => void>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.sdk }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: mocks.getAll, set: mocks.set }),
}));
vi.mock("../env", () => ({
  getServerEnv: () => ({
    SUPABASE_URL: "http://127.0.0.1:9",
    SUPABASE_ANON_KEY: "fixture-public-key",
  }),
}));

import {
  createAuthClient,
  createServerAuthClient,
  readVerifiedIdentity,
} from "./supabase";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("cliente SSR e identidade verificada", () => {
  it("CA-04 configura cookies httpOnly, sameSite e secure em produção", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await createServerAuthClient();
    expect(mocks.sdk).toHaveBeenCalledWith(
      "http://127.0.0.1:9",
      "fixture-public-key",
      expect.objectContaining({
        cookieOptions: {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        },
      }),
    );
    const options = mocks.sdk.mock.calls[0][2];
    expect(await options.cookies.getAll()).toEqual([
      { name: "sb-fixture-auth-token", value: "fixture" },
    ]);
    await options.cookies.setAll?.([
      {
        name: "sb-fixture-auth-token",
        value: "fixture-renewed",
        options: {
          httpOnly: false,
          secure: false,
          sameSite: "none",
          path: "/other",
          maxAge: 42,
        },
      },
    ]);
    expect(mocks.set).toHaveBeenCalledWith(
      "sb-fixture-auth-token",
      "fixture-renewed",
      {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 42,
      },
    );
  });

  it("CA-04 preserva remoção de cookie e permite HTTP apenas no modo local", async () => {
    createAuthClient(
      { getAll: mocks.getAll, set: mocks.set },
      {
        url: "http://127.0.0.1:9",
        key: "fixture-public-key",
        secure: false,
      },
    );
    await mocks.sdk.mock.calls[0][2].cookies.setAll?.([
      { name: "sb-fixture-auth-token", value: "", options: { maxAge: 0 } },
    ]);
    expect(mocks.set).toHaveBeenCalledWith("sb-fixture-auth-token", "", {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
    });
  });

  it("CA-07 só usa id retornado por getUser, sem papel ou metadados da sessão", async () => {
    const getUser = vi.fn(async () => ({
      data: {
        user: {
          id: "fixture-user",
          user_metadata: { role: "ADMIN" },
          access_token: "fixture",
        },
      },
      error: null,
    }));
    await expect(readVerifiedIdentity({ auth: { getUser } })).resolves.toEqual({
      id: "fixture-user",
    });
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("CA-05 rejeita usuário retornado junto de erro de validação", async () => {
    await expect(
      readVerifiedIdentity({
        auth: {
          getUser: async () => ({
            data: { user: { id: "fixture-user" } },
            error: { status: 401, message: "fixture-invalid" },
          }),
        },
      }),
    ).resolves.toBeNull();
  });

  it("CA-05 não considera sessão sem usuário autenticada", async () => {
    await expect(
      readVerifiedIdentity({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: null,
          }),
        },
      }),
    ).resolves.toBeNull();
  });

  it("CA-05 trata sessão ausente informada pelo SDK como não autenticada", async () => {
    await expect(
      readVerifiedIdentity({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: { status: 400, name: "AuthSessionMissingError" },
          }),
        },
      }),
    ).resolves.toBeNull();
  });

  it("CA-05 não confunde indisponibilidade retornada pelo provedor com sessão inválida", async () => {
    await expect(
      readVerifiedIdentity({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: {
              status: 503,
              message: "fixture-sensitive-provider-detail",
            },
          }),
        },
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível verificar a sessão.",
      cause: undefined,
    });
  });

  it("CA-05 falha fechada sem expor erro lançado pelo provedor", async () => {
    await expect(
      readVerifiedIdentity({
        auth: {
          getUser: async () => {
            throw new Error("fixture-sensitive-provider-detail");
          },
        },
      }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível verificar a sessão.",
      cause: undefined,
    });
  });
});
