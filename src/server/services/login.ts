import "server-only";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  AUTHENTICATED_PATH,
  LOGIN_FAILURE,
  type LoginInput,
} from "../../shared/login";
import {
  createLoginAuthClient,
  readVerifiedIdentity,
  type IdentityClient,
} from "../auth/supabase";
import { resolveAccess } from "./access";

export type PasswordAuth = {
  client: IdentityClient & {
    auth: {
      signInWithPassword(input: LoginInput): Promise<{ error: unknown }>;
    };
  };
  commit: () => void;
};

export async function signIn(
  input: LoginInput,
  database: PrismaClient,
  createAuth: () => Promise<PasswordAuth> = createLoginAuthClient,
) {
  try {
    const auth = await createAuth();
    const { error } = await auth.client.auth.signInWithPassword(input);
    if (error) {
      const status =
        typeof error === "object" && "status" in error
          ? error.status
          : undefined;
      if (status === 400 || status === 401 || status === 403)
        throw new TRPCError({ code: "UNAUTHORIZED", message: LOGIN_FAILURE });
      throw new Error("Provedor indisponível.");
    }
    // Não confiar no usuário embutido na resposta de login nem em metadados.
    const identity = await readVerifiedIdentity(auth.client);
    if (!identity)
      throw new TRPCError({ code: "UNAUTHORIZED", message: LOGIN_FAILURE });
    await resolveAccess(identity, database);
    auth.commit();
    return { redirectTo: AUTHENTICATED_PATH };
  } catch (error) {
    if (error instanceof TRPCError && error.code === "FORBIDDEN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acesso não permitido.",
      });
    }
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      throw new TRPCError({ code: "UNAUTHORIZED", message: LOGIN_FAILURE });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível entrar agora.",
    });
  }
}
