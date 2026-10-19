import { Prisma } from "@prisma/client";
import { getDb } from "../../../server/db";
import { createHealthResponse } from "../../../server/health";

const checkDatabase = () => getDb().$queryRaw(Prisma.sql`SELECT 1`);

export function GET() {
  return createHealthResponse(checkDatabase);
}
