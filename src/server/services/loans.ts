import "server-only";
import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { AccessContext } from "./access";
import type { PaginationInput } from "../../shared/loans";
import {
  assertCanBorrow,
  calculateDueAt,
  LoanPolicyError,
} from "./loan-policy";

export async function listOwnOpenLoans(
  database: PrismaClient,
  access: AccessContext,
  input: PaginationInput,
) {
  const where = {
    tenantId: access.tenantId,
    userId: access.userId,
    returnedAt: null,
  };
  if (input.cursor) {
    const cursor = await database.loan.findFirst({
      where: { ...where, id: input.cursor },
      select: { id: true },
    });
    if (!cursor)
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cursor inválido." });
  }
  const rows = await database.loan.findMany({
    where,
    take: input.limit + 1,
    orderBy: [{ issuedAt: "desc" }, { id: "desc" }],
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      equipmentId: true,
      issuedAt: true,
      dueAt: true,
      returnedAt: true,
      equipment: {
        select: {
          id: true,
          assetTag: true,
          name: true,
          category: true,
          status: true,
        },
      },
    },
  });
  const hasMore = rows.length > input.limit;
  const items = rows.slice(0, input.limit);
  return { items, nextCursor: hasMore ? items.at(-1)!.id : null };
}

/** A server-generated timestamp may be injected only by local tests. */
export async function requestLoan(
  database: Pick<PrismaClient, "$transaction">,
  access: AccessContext,
  equipmentId: string,
  issuedAt = new Date(),
) {
  let dueAt: Date;
  try {
    dueAt = calculateDueAt(issuedAt);
  } catch {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Calendário de empréstimos precisa ser atualizado.",
    });
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await database.$transaction(
        async (transaction) => {
          // The user lock also protects simultaneous requests for different items.
          const membership = await transaction.$queryRaw<{ user_id: string }[]>`
          SELECT user_id FROM "Membership"
          WHERE tenant_id = ${access.tenantId}::uuid AND user_id = ${access.userId}::uuid
          FOR UPDATE
        `;
          if (!membership.length)
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Acesso não permitido.",
            });
          const equipment = await transaction.$queryRaw<
            { id: string; status: "AVAILABLE" | "LOANED" | "MAINTENANCE" }[]
          >`
          SELECT id, status FROM "Equipment"
          WHERE tenant_id = ${access.tenantId}::uuid AND id = ${equipmentId}::uuid
          FOR UPDATE
        `;
          if (!equipment[0])
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Equipamento não encontrado.",
            });
          const itemLoan = await transaction.loan.findFirst({
            where: { tenantId: access.tenantId, equipmentId, returnedAt: null },
            select: { id: true },
          });
          const ownLoans = await transaction.loan.findMany({
            where: {
              tenantId: access.tenantId,
              userId: access.userId,
              returnedAt: null,
            },
            select: { dueAt: true, returnedAt: true },
          });
          assertCanBorrow(
            itemLoan ? "LOANED" : equipment[0].status,
            ownLoans,
            issuedAt,
          );
          const updated = await transaction.equipment.updateMany({
            where: {
              id: equipmentId,
              tenantId: access.tenantId,
              status: "AVAILABLE",
            },
            data: { status: "LOANED" },
          });
          if (updated.count !== 1) throw new LoanPolicyError("UNAVAILABLE");
          const loan = await transaction.loan.create({
            data: {
              tenantId: access.tenantId,
              equipmentId,
              userId: access.userId,
              issuedAt,
              dueAt,
            },
            select: {
              id: true,
              equipmentId: true,
              issuedAt: true,
              dueAt: true,
              returnedAt: true,
            },
          });
          await transaction.auditEvent.create({
            data: {
              tenantId: access.tenantId,
              actorId: access.userId,
              action: "loan.created",
              resourceId: loan.id,
            },
          });
          return loan;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 10_000,
        },
      );
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof LoanPolicyError) {
        throw new TRPCError({ code: "CONFLICT", message: error.message });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const serializationConflict =
          error.code === "P2034" ||
          (error.code === "P2010" &&
            (error.meta?.code === "40001" || error.meta?.code === "40P01"));
        if (serializationConflict && attempt < 2) continue;
        if (serializationConflict || error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "A disponibilidade mudou. Atualize o catálogo e tente novamente.",
          });
        }
      }
      // Driver errors can include connection strings. Never publish their text.
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível concluir a solicitação.",
      });
    }
  }
  throw new TRPCError({
    code: "CONFLICT",
    message: "Atualize o catálogo e tente novamente.",
  });
}
