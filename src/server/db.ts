import "server-only";
import { PrismaClient } from "@prisma/client";
import { getServerEnv } from "./env";

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export function getDb() {
  if (!globalDb.prisma) {
    globalDb.prisma = new PrismaClient({
      datasourceUrl: getServerEnv().DATABASE_URL,
    });
  }
  return globalDb.prisma;
}
