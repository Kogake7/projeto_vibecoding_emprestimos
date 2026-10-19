import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
async function main() {
  await db.tenant.upsert({
    where: { slug: "suporte_ti" },
    update: {},
    create: { slug: "suporte_ti", name: "Suporte TI" },
  });
}
main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
