import "server-only";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { authRouter } from "./routers/auth";
import { equipmentRouter } from "./routers/equipment";
import { loansRouter } from "./routers/loans";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  equipment: equipmentRouter,
  loans: loansRouter,
});
export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
