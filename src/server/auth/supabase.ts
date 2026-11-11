import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";
import { getServerEnv } from "../env";
import type { VerifiedIdentity } from "../services/access";

export interface IdentityClient {
  auth: {
    getUser(): Promise<{
      data: { user: { id: string } | null };
      error: unknown;
    }>;
  };
}

export interface AuthCookies {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options: CookieOptions): void;
}

export function createAuthClient(
  cookieStore: AuthCookies,
  configuration: { url: string; key: string; secure: boolean },
) {
  const protectedOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: configuration.secure,
  };

  return createServerClient(configuration.url, configuration.key, {
    cookieOptions: protectedOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (updates) => {
        for (const { name, value, options } of updates) {
          cookieStore.set(name, value, { ...options, ...protectedOptions });
        }
      },
    },
  });
}

export async function createServerAuthClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();
  return createAuthClient(cookieStore, {
    url: env.SUPABASE_URL,
    key: env.SUPABASE_ANON_KEY,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Publica a nova sessão somente após confirmar a Membership. */
export async function createLoginAuthClient() {
  const store = await cookies();
  const env = getServerEnv();
  const pending = new Map<string, { value: string; options: CookieOptions }>();
  const client = createAuthClient(
    {
      getAll: () => {
        const values = new Map(
          store.getAll().map(({ name, value }) => [name, value]),
        );
        for (const [name, cookie] of pending) values.set(name, cookie.value);
        return [...values].map(([name, value]) => ({ name, value }));
      },
      set: (name, value, options) => {
        pending.set(name, { value, options });
      },
    },
    {
      url: env.SUPABASE_URL,
      key: env.SUPABASE_ANON_KEY,
      secure: process.env.NODE_ENV === "production",
    },
  );
  return {
    client,
    commit: () => {
      for (const [name, { value, options }] of pending)
        store.set(name, value, options);
      pending.clear();
    },
  };
}

export async function readVerifiedIdentity(
  client: IdentityClient,
): Promise<VerifiedIdentity | null> {
  try {
    // getUser verifica a sessão no provedor; getSession não valida a identidade.
    const { data, error } = await client.auth.getUser();
    if (error) {
      const status =
        typeof error === "object" && "status" in error
          ? error.status
          : undefined;
      if (status === 400 || status === 401 || status === 403) return null;
      // Indisponibilidade não deve parecer uma sessão inválida para o cliente.
      throw new Error("Falha na verificação do provedor.");
    }
    if (!data.user?.id) return null;
    return { id: data.user.id };
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível verificar a sessão.",
    });
  }
}
