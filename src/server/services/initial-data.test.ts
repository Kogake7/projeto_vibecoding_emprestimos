import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestPostgres } from "../../test-support/postgres";
import inventory from "../../shared/equipment-inventory.json";
import {
  applyInitialInventory,
  getVerifiedProfessorIdentity,
  provisionProfessorMembership,
  PROFESSOR_EMAIL,
} from "./initial-data";

describe("Spec 002 — população idempotente em PostgreSQL real", () => {
  let fixture: Awaited<ReturnType<typeof createTestPostgres>>;
  let tenantId: string;

  beforeAll(async () => {
    fixture = await createTestPostgres();
    // Controlled external-provider fixture, only in this loopback disposable DB.
    // These are not application schema changes or production migrations.
    await fixture.db.$executeRaw`CREATE SCHEMA auth`;
    await fixture.db
      .$executeRaw`CREATE TABLE auth.users (id uuid PRIMARY KEY, email text)`;
  }, 60_000);
  afterAll(async () => {
    await fixture?.dispose();
  }, 20_000);

  const professor = () => ({ id: randomUUID(), email: PROFESSOR_EMAIL });
  const equipmentRows = () =>
    fixture.db.equipment.findMany({
      where: { tenantId },
      orderBy: { assetTag: "asc" },
    });

  it("CA-04 recusa provisionamento antes do inventário sem criar tenant ou vínculo", async () => {
    await expect(
      provisionProfessorMembership(fixture.db, professor()),
    ).rejects.toThrow("inventário");
    expect(await fixture.db.tenant.count()).toBe(0);
    expect(await fixture.db.membership.count()).toBe(0);
  });

  it("CA-01 CA-07 cria doze itens exatos, nove disponíveis e três em manutenção", async () => {
    const result = await applyInitialInventory(fixture.db);
    tenantId = result.tenantId;
    expect(result).toMatchObject({ created: 12, preserved: 0 });
    const rows = await equipmentRows();
    expect(
      rows.map(({ assetTag, name, category }) => [assetTag, name, category]),
    ).toEqual([
      ["TI-0001", "Notebook 14 polegadas", "notebook"],
      ["TI-0002", "Notebook 15 polegadas", "notebook"],
      ["TI-0003", "Notebook 13 polegadas", "notebook"],
      ["TI-0004", "Notebook 15 polegadas", "notebook"],
      ["TI-0005", "Monitor 24 polegadas", "monitor"],
      ["TI-0006", "Monitor 27 polegadas", "monitor"],
      ["TI-0007", "Monitor 22 polegadas", "monitor"],
      ["TI-0008", "Cabo HDMI 2 m", "cabo"],
      ["TI-0009", "Cabo USB-C 1 m", "cabo"],
      ["TI-0010", "Cabo de rede 3 m", "cabo"],
      ["TI-0011", "Webcam Full HD", "camera"],
      ["TI-0012", "Câmera compacta", "camera"],
    ]);
    expect(
      rows
        .filter((row) => row.status === "MAINTENANCE")
        .map((row) => row.assetTag),
    ).toEqual(["TI-0004", "TI-0007", "TI-0010"]);
    expect(rows.filter((row) => row.status === "AVAILABLE")).toHaveLength(9);
    expect(inventory.map((row) => row.assetTag)).toEqual(
      rows.map((row) => row.assetTag),
    );
    // Independent oracle transcribed from the assignment; do not derive it from
    // the implementation's inventory when changing the lookup terms.
    expect(inventory.map((row) => [row.assetTag, row.search])).toEqual([
      ["TI-0001", "laptop on white desk"],
      ["TI-0002", "open laptop minimal desk"],
      ["TI-0003", "laptop closeup keyboard"],
      ["TI-0004", "closed laptop on table"],
      ["TI-0005", "computer monitor on desk"],
      ["TI-0006", "monitor screen office desk"],
      ["TI-0007", "black computer screen"],
      ["TI-0008", "hdmi cable"],
      ["TI-0009", "usb cable white background"],
      ["TI-0010", "ethernet cable"],
      ["TI-0011", "webcam"],
      ["TI-0012", "compact camera on table"],
    ]);
    expect(await fixture.db.loan.count()).toBe(0);
    expect(await fixture.db.membership.count()).toBe(0);
  });

  it("CA-04 consulta Auth real exige UUID existente e email do professor antes do vínculo", async () => {
    const expected = professor();
    const otherId = randomUUID();
    await fixture.db
      .$executeRaw`INSERT INTO auth.users (id, email) VALUES (${expected.id}::uuid, ${expected.email}), (${otherId}::uuid, ${"fixture-other@example.test"})`;
    const identity = await getVerifiedProfessorIdentity(
      fixture.db,
      expected.id,
    );
    expect(identity).toEqual(expected);
    expect(await provisionProfessorMembership(fixture.db, identity)).toEqual({
      userId: expected.id,
      tenantId,
      role: "ADMIN",
    });
    for (const id of [otherId, randomUUID()]) {
      await expect(
        getVerifiedProfessorIdentity(fixture.db, id),
      ).rejects.toThrow("Identidade não encontrada");
      expect(await fixture.db.membership.count({ where: { userId: id } })).toBe(
        0,
      );
    }
  });

  it("CA-04 UUID inválido falha antes de executar SQL no provedor Auth", async () => {
    const database = new PrismaClient({
      datasourceUrl: fixture.url,
      log: [{ emit: "event", level: "query" }],
    });
    let queries = 0;
    database.$on("query", () => {
      queries++;
    });
    try {
      await database.$connect();
      queries = 0;
      await expect(
        getVerifiedProfessorIdentity(database, "invalid-uuid"),
      ).rejects.toThrow("Identidade não encontrada");
      expect(queries).toBe(0);
      await expect(
        getVerifiedProfessorIdentity(database, randomUUID()),
      ).rejects.toThrow("Identidade não encontrada");
      expect(queries).toBeGreaterThan(0);
    } finally {
      await database.$disconnect();
    }
  });

  it("CA-02 preserva IDs, estado operacional, empréstimos e auditoria na reexecução", async () => {
    const rows = await equipmentRows();
    const userId = randomUUID();
    await fixture.db.membership.create({
      data: { userId, tenantId, role: "COLLABORATOR" },
    });
    await fixture.db.equipment.update({
      where: { id: rows[0].id },
      data: { status: "LOANED" },
    });
    await fixture.db.equipment.update({
      where: { id: rows[1].id },
      data: { status: "MAINTENANCE" },
    });
    const loan = await fixture.db.loan.create({
      data: {
        userId,
        tenantId,
        equipmentId: rows[0].id,
        issuedAt: new Date("2026-09-14T12:00:00Z"),
        dueAt: new Date("2026-10-01T12:00:00Z"),
      },
    });
    await fixture.db.auditEvent.create({
      data: {
        tenantId,
        actorId: userId,
        action: "fixture.loan",
        resourceId: loan.id,
      },
    });
    const before = await equipmentRows();
    const beforeLoans = await fixture.db.loan.findMany();
    const beforeAudit = await fixture.db.auditEvent.findMany();
    expect(await applyInitialInventory(fixture.db)).toEqual({
      tenantId,
      created: 0,
      preserved: 12,
    });
    expect(await equipmentRows()).toEqual(before);
    expect(await fixture.db.loan.findMany()).toEqual(beforeLoans);
    expect(await fixture.db.auditEvent.findMany()).toEqual(beforeAudit);
  });

  it.each(["name", "category"] as const)(
    "CA-03 conflito de %s aborta lote com item ausente sem criação parcial",
    async (field) => {
      const conflicting = await fixture.db.equipment.findUniqueOrThrow({
        where: { tenantId_assetTag: { tenantId, assetTag: "TI-0008" } },
      });
      const missing = await fixture.db.equipment.findUniqueOrThrow({
        where: { tenantId_assetTag: { tenantId, assetTag: "TI-0012" } },
      });
      await fixture.db.equipment.update({
        where: { id: conflicting.id },
        data:
          field === "name"
            ? { name: "Nome conflitante" }
            : { category: "categoria-conflitante" },
      });
      await fixture.db.equipment.delete({ where: { id: missing.id } });
      try {
        const before = await equipmentRows();
        await expect(applyInitialInventory(fixture.db)).rejects.toThrow(
          "conflitante",
        );
        expect(await equipmentRows()).toEqual(before);
        expect(
          await fixture.db.equipment.findUnique({ where: { id: missing.id } }),
        ).toBeNull();
      } finally {
        await fixture.db.equipment.update({
          where: { id: conflicting.id },
          data: { name: conflicting.name, category: conflicting.category },
        });
        await fixture.db.equipment.create({ data: missing });
      }
    },
  );

  it("CA-03 patrimônio extra é preservado e causa recusa sem alterar o conjunto", async () => {
    const extra = await fixture.db.equipment.create({
      data: {
        tenantId,
        assetTag: "TI-9999",
        name: "Item extra da fixture",
        category: "camera",
      },
    });
    try {
      const before = await equipmentRows();
      await expect(applyInitialInventory(fixture.db)).rejects.toThrow(
        "conflitante",
      );
      expect(await equipmentRows()).toEqual(before);
    } finally {
      await fixture.db.equipment.delete({ where: { id: extra.id } });
    }
  });

  it("CA-04 cria e preserva ADMIN sem empréstimos para identidade sintética verificada", async () => {
    const identity = professor();
    const first = await provisionProfessorMembership(fixture.db, identity);
    expect(first).toEqual({ userId: identity.id, tenantId, role: "ADMIN" });
    expect(await provisionProfessorMembership(fixture.db, identity)).toEqual(
      first,
    );
    expect(
      await fixture.db.membership.count({ where: { userId: identity.id } }),
    ).toBe(1);
    expect(
      await fixture.db.loan.count({ where: { userId: identity.id } }),
    ).toBe(0);
  });

  it("CA-04 papel existente COLLABORATOR é preservado sem elevação implícita", async () => {
    const identity = professor();
    const existing = await fixture.db.membership.create({
      data: { tenantId, userId: identity.id, role: "COLLABORATOR" },
    });
    await expect(
      provisionProfessorMembership(fixture.db, identity),
    ).rejects.toThrow("conflita");
    expect(
      await fixture.db.membership.findUnique({
        where: { tenantId_userId: { tenantId, userId: identity.id } },
      }),
    ).toEqual(existing);
  });

  it.each([false, true])(
    "CA-04 empréstimo sintético existente devolvido=%s impede provisionamento e preserva histórico",
    async (returned) => {
      const identity = professor();
      await fixture.db.membership.create({
        data: { tenantId, userId: identity.id, role: "ADMIN" },
      });
      const equipment = await fixture.db.equipment.findUniqueOrThrow({
        where: {
          tenantId_assetTag: {
            tenantId,
            assetTag: returned ? "TI-0005" : "TI-0003",
          },
        },
      });
      const loan = await fixture.db.loan.create({
        data: {
          tenantId,
          userId: identity.id,
          equipmentId: equipment.id,
          issuedAt: new Date("2026-09-14T12:00:00Z"),
          dueAt: new Date("2026-10-01T12:00:00Z"),
          returnedAt: returned ? new Date("2026-09-15T12:00:00Z") : null,
        },
      });
      await expect(
        provisionProfessorMembership(fixture.db, identity),
      ).rejects.toThrow("já possui empréstimos");
      expect(
        await fixture.db.loan.findUnique({ where: { id: loan.id } }),
      ).toEqual(loan);
      expect(
        (
          await fixture.db.membership.findUniqueOrThrow({
            where: { tenantId_userId: { tenantId, userId: identity.id } },
          })
        ).role,
      ).toBe("ADMIN");
    },
  );

  it("CA-04 identidade com email ou UUID incorreto falha sem criar vínculos", async () => {
    const before = await fixture.db.membership.count();
    await expect(
      provisionProfessorMembership(fixture.db, {
        id: randomUUID(),
        email: "fixture-other@example.test",
      }),
    ).rejects.toThrow("identidade");
    await expect(
      provisionProfessorMembership(fixture.db, {
        id: "not-a-uuid",
        email: PROFESSOR_EMAIL,
      }),
    ).rejects.toThrow("identidade");
    expect(await fixture.db.membership.count()).toBe(before);
  });

  it("CA-06 dados do outro tenant sobrevivem inventário e recusas de provisionamento", async () => {
    const other = await fixture.db.tenant.create({
      data: { slug: "fixture-outro", name: "Outro tenant" },
    });
    const userId = randomUUID();
    const member = await fixture.db.membership.create({
      data: { tenantId: other.id, userId, role: "ADMIN" },
    });
    const equipment = await fixture.db.equipment.create({
      data: {
        tenantId: other.id,
        assetTag: "TI-0001",
        name: "Nome do outro tenant",
        category: "outra",
        status: "LOANED",
      },
    });
    const loan = await fixture.db.loan.create({
      data: {
        tenantId: other.id,
        userId,
        equipmentId: equipment.id,
        issuedAt: new Date("2026-09-14T12:00:00Z"),
        dueAt: new Date("2026-10-01T12:00:00Z"),
      },
    });
    const event = await fixture.db.auditEvent.create({
      data: {
        tenantId: other.id,
        actorId: userId,
        action: "fixture.loan",
        resourceId: loan.id,
      },
    });
    await applyInitialInventory(fixture.db);
    await expect(
      provisionProfessorMembership(fixture.db, {
        id: userId,
        email: PROFESSOR_EMAIL,
      }),
    ).rejects.toThrow("já possui empréstimos");
    expect(
      await fixture.db.tenant.findUnique({ where: { id: other.id } }),
    ).toEqual(other);
    expect(
      await fixture.db.membership.findUnique({
        where: { tenantId_userId: { tenantId: other.id, userId } },
      }),
    ).toEqual(member);
    expect(
      await fixture.db.membership.findUnique({
        where: { tenantId_userId: { tenantId, userId } },
      }),
    ).toBeNull();
    expect(
      await fixture.db.equipment.findUnique({ where: { id: equipment.id } }),
    ).toEqual(equipment);
    expect(
      await fixture.db.loan.findUnique({ where: { id: loan.id } }),
    ).toEqual(loan);
    expect(
      await fixture.db.auditEvent.findUnique({ where: { id: event.id } }),
    ).toEqual(event);
  });
});
