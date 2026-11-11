import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { z } from "zod";
import {
  getVerifiedProfessorIdentity,
  provisionProfessorMembership,
} from "../src/server/services/initial-data";
import { assertInitialDataTarget } from "../src/server/services/initial-data-target";

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean" },
      "confirm-target": { type: "string" },
      "user-id": { type: "string" },
    },
  });
  const target = assertInitialDataTarget(
    { apply: values.apply, confirmTarget: values["confirm-target"] },
    process.env.DATABASE_URL,
  );
  const userId = z.uuid().parse(values["user-id"]);
  const db = new PrismaClient();
  try {
    const identity = await getVerifiedProfessorIdentity(db, userId);
    await provisionProfessorMembership(db, identity);
    console.log(JSON.stringify({ target, role: "ADMIN", loans: 0 }));
  } finally {
    await db.$disconnect();
  }
}

main().catch(() => {
  console.error(
    "Provisionamento recusado. Confira alvo, UUID, conta Auth do professor, papel existente e ausência de empréstimos. Nenhuma senha foi alterada.",
  );
  process.exitCode = 1;
});
