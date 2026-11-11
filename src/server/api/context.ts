import "server-only";
import type { PrismaClient } from "@prisma/client";
import {
  createServerAuthClient,
  readVerifiedIdentity,
  type IdentityClient,
} from "../auth/supabase";
import { getDb } from "../db";
import { signIn, type PasswordAuth } from "../services/login";
import type { LoginInput } from "../../shared/login";
import {
  resolveAccess,
  type AccessContext,
  type VerifiedIdentity,
} from "../services/access";

export type RequestContext = {
  identity: VerifiedIdentity | null;
  getDatabase: () => PrismaClient;
  getAccess: () => Promise<AccessContext>;
  signIn: (input: LoginInput) => Promise<{ redirectTo: string }>;
};

/** Dependências injetadas apenas pelo servidor/testes, nunca pela requisição. */
export async function createContext(
  dependencies: {
    authClient?: IdentityClient;
    database?: PrismaClient;
    passwordAuth?: () => Promise<PasswordAuth>;
  } = {},
): Promise<RequestContext> {
  const authClient =
    dependencies.authClient ?? (await createServerAuthClient());
  const identity = await readVerifiedIdentity(authClient);
  let database = dependencies.database;
  let access: Promise<AccessContext> | undefined;
  const getDatabase = () => (database ??= getDb());

  return {
    identity,
    getDatabase,
    signIn: (input) => signIn(input, getDatabase(), dependencies.passwordAuth),
    getAccess: () =>
      (access ??= identity
        ? resolveAccess(identity, getDatabase())
        : resolveAccess(null)),
  };
}
