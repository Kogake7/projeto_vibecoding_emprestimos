import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { RequestContext } from "./context";

const t = initTRPC.context<RequestContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const message =
      error.code === "INTERNAL_SERVER_ERROR"
        ? "Não foi possível concluir a solicitação."
        : error.code === "BAD_REQUEST"
          ? "Solicitação inválida."
          : error.message;
    return {
      message,
      code: shape.code,
      data: { code: shape.data.code, httpStatus: shape.data.httpStatus },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.identity) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Autenticação necessária.",
    });
  }
  return next({ ctx: { identity: ctx.identity } });
});

export const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const access = await ctx.getAccess();
  return next({ ctx: { ...access, db: ctx.getDatabase() } });
});

export const adminProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso não permitido.",
    });
  }
  return next();
});
