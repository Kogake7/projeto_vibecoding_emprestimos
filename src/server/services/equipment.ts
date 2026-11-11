import "server-only";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { AccessContext } from "./access";
import type { PaginationInput } from "../../shared/loans";

export async function listEquipment(
  database: PrismaClient,
  access: AccessContext,
  input: PaginationInput,
) {
  if (input.cursor) {
    const cursor = await database.equipment.findFirst({
      where: { id: input.cursor, tenantId: access.tenantId },
      select: { id: true },
    });
    if (!cursor)
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cursor inválido." });
  }
  const rows = await database.equipment.findMany({
    where: { tenantId: access.tenantId },
    orderBy: [{ assetTag: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      assetTag: true,
      name: true,
      category: true,
      status: true,
      loans: { where: { returnedAt: null }, take: 1, select: { id: true } },
    },
  });
  const hasMore = rows.length > input.limit;
  const items = rows.slice(0, input.limit).map(({ loans, ...item }) => ({
    ...item,
    status:
      item.status === "AVAILABLE" && loans.length
        ? ("LOANED" as const)
        : item.status,
  }));
  return { items, nextCursor: hasMore ? items.at(-1)!.id : null };
}
