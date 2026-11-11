import "server-only";
import {
  paginationInputSchema,
  requestLoanSchema,
} from "../../../shared/loans";
import { listOwnOpenLoans, requestLoan } from "../../services/loans";
import { router, tenantProcedure } from "../trpc";

export const loansRouter = router({
  mine: tenantProcedure
    .input(paginationInputSchema)
    .query(({ ctx, input }) => listOwnOpenLoans(ctx.db, ctx, input)),
  request: tenantProcedure
    .input(requestLoanSchema)
    .mutation(({ ctx, input }) => requestLoan(ctx.db, ctx, input.equipmentId)),
});
