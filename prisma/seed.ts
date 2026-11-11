import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { applyInitialInventory } from "../src/server/services/initial-data";
import { assertInitialDataTarget } from "../src/server/services/initial-data-target";

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean" },
      "confirm-target": { type: "string" },
    },
  });
  const target = assertInitialDataTarget(
    { apply: values.apply, confirmTarget: values["confirm-target"] },
    process.env.DATABASE_URL,
  );
  const db = new PrismaClient();
  try {
    const result = await applyInitialInventory(db);
    console.log(JSON.stringify({ target, ...result }));
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "População recusada ou indisponível. Confira confirmação de alvo, conexão e conflitos no inventário. Nenhum reset foi executado.",
  );
  process.exitCode = 1;
});
