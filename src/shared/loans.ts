import { z } from "zod";

export const paginationInputSchema = z
  .strictObject({
    cursor: z.uuid().optional(),
    limit: z.number().int().min(1).max(50).default(12),
  })
  .default({ limit: 12 });

export const requestLoanSchema = z.strictObject({ equipmentId: z.uuid() });

export type PaginationInput = z.output<typeof paginationInputSchema>;
