import "server-only";
import { z } from "zod";
import { router, tenantProcedure, publicProcedure } from "../trpc";
import { loginSchema } from "../../../shared/login";

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(({ ctx, input }) => ctx.signIn(input)),
  me: tenantProcedure.input(z.strictObject({}).optional()).query(({ ctx }) => ({
    userId: ctx.userId,
    tenantId: ctx.tenantId,
    role: ctx.role,
  })),
});
