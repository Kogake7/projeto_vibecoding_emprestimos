import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { z } from "zod";
import {
  PROFESSOR_EMAIL,
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
    const identities = await db.$queryRaw<{ id: string; email: string }[]>`
      SELECT id, email FROM auth.users
      WHERE id = ${userId}::uuid AND lower(email) = ${PROFESSOR_EMAIL}
    `;
    if (identities.length !== 1) throw new Error("Identidade não encontrada.");
    await provisionProfessorMembership(db, identities[0]);
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
