import "server-only";
import type { PrismaClient, Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/** Identidade já verificada pelo provedor no servidor, nunca input da API. */
export type VerifiedIdentity = Readonly<{ id: string }>;

export type AccessContext = Readonly<{
  userId: string;
  tenantId: string;
  role: Role;
}>;

const MVP_TENANT_SLUG = "suporte_ti";

export async function resolveAccess(
  identity: VerifiedIdentity | null,
  database?: PrismaClient,
): Promise<AccessContext> {
  // Não inicializar nem consultar o banco antes de exigir identidade.
  if (!identity?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Autenticação necessária.",
    });
  }

  let membership: AccessContext | null = null;
  try {
    const db = database ?? getDb();
    const tenant = await db.tenant.findUnique({
      where: { slug: MVP_TENANT_SLUG },
      select: { id: true },
    });

    if (tenant) {
      membership = await db.membership.findUnique({
        where: {
          tenantId_userId: { tenantId: tenant.id, userId: identity.id },
        },
        select: { userId: true, tenantId: true, role: true },
      });
    }
  } catch {
    // Erros do driver podem conter dados de conexão; não os repassar ao cliente.
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Não foi possível verificar o acesso.",
    });
  }

  // Ausência do tenant e ausência de vínculo têm a mesma resposta pública.
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso não permitido.",
    });
  }

  return {
    userId: membership.userId,
    tenantId: membership.tenantId,
    role: membership.role,
  };
}
