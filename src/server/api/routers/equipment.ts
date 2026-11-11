import "server-only";
import { paginationInputSchema } from "../../../shared/loans";
import { listEquipment } from "../../services/equipment";
import { router, tenantProcedure } from "../trpc";

export const equipmentRouter = router({
  list: tenantProcedure
    .input(paginationInputSchema)
    .query(({ ctx, input }) => listEquipment(ctx.db, ctx, input)),
});
