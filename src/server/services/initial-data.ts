import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import inventorySource from "../../shared/equipment-inventory.json";

export const PROFESSOR_EMAIL = "marcelo.grilo@institutojef.org.br";
const inventory = z
  .array(
    z.object({
      assetTag: z.string().regex(/^TI-\d{4}$/),
      name: z.string().min(1),
      category: z.enum(["notebook", "monitor", "cabo", "camera"]),
      initialStatus: z.enum(["AVAILABLE", "MAINTENANCE"]),
      search: z.string().min(1),
    }),
  )
  .length(12)
  .refine((rows) => new Set(rows.map((row) => row.assetTag)).size === 12)
  .parse(inventorySource);

/** Importado apenas por comandos do operador e testes, nunca por rotas públicas. */
export async function applyInitialInventory(db: PrismaClient) {
  return db.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.upsert({
        where: { slug: "suporte_ti" },
        create: { slug: "suporte_ti", name: "Suporte TI" },
        update: {},
      });
      await tx.$queryRaw`SELECT id FROM "Tenant" WHERE id = ${tenant.id}::uuid FOR UPDATE`;
      const existing = await tx.equipment.findMany({
        where: { tenantId: tenant.id },
      });
      const expected = new Map(inventory.map((row) => [row.assetTag, row]));
      for (const row of existing) {
        const entry = expected.get(row.assetTag);
        if (
          !entry ||
          entry.name !== row.name ||
          entry.category !== row.category
        )
          throw new Error(
            "Inventário existente conflitante; nenhum equipamento foi alterado.",
          );
      }
      const present = new Set(existing.map((row) => row.assetTag));
      const missing = inventory.filter((row) => !present.has(row.assetTag));
      if (missing.length)
        await tx.equipment.createMany({
          data: missing.map((row) => ({
            tenantId: tenant.id,
            assetTag: row.assetTag,
            name: row.name,
            category: row.category,
            status: row.initialStatus,
          })),
        });
      return {
        tenantId: tenant.id,
        created: missing.length,
        preserved: existing.length,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function provisionProfessorMembership(
  db: PrismaClient,
  verifiedIdentity: { id: string; email: string },
) {
  if (
    !z.uuid().safeParse(verifiedIdentity.id).success ||
    verifiedIdentity.email.trim().toLowerCase() !== PROFESSOR_EMAIL
  )
    throw new Error(
      "A identidade verificada não pertence ao professor esperado.",
    );

  return db.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { slug: "suporte_ti" },
      });
      if (!tenant)
        throw new Error("Execute primeiro o inventário de suporte_ti.");
      await tx.$queryRaw`SELECT id FROM "Tenant" WHERE id = ${tenant.id}::uuid FOR UPDATE`;
      const userId = verifiedIdentity.id;
      const current = await tx.membership.findUnique({
        where: { tenantId_userId: { tenantId: tenant.id, userId } },
      });
      if (current && current.role !== "ADMIN")
        throw new Error(
          "O papel existente conflita com ADMIN; vínculo preservado.",
        );
      if ((await tx.loan.count({ where: { userId } })) !== 0)
        throw new Error(
          "O professor já possui empréstimos; histórico preservado.",
        );
      return tx.membership.upsert({
        where: { tenantId_userId: { tenantId: tenant.id, userId } },
        create: { tenantId: tenant.id, userId, role: "ADMIN" },
        update: {},
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
