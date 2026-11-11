import { randomUUID } from "node:crypto";
import { PrismaClient, type EquipmentStatus, type Role } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createTestPostgres } from "../../test-support/postgres";
import { createContext } from "./context";
import { createTRPCHandler } from "./handler";
import { appRouter } from "./root";
import { calculateDueAt } from "../services/loan-policy";
import { requestLoan } from "../services/loans";

const instant = new Date("2026-09-14T12:34:56.789Z");

describe("Spec 003 — catálogo e solicitação em PostgreSQL real", () => {
  let fixture: Awaited<ReturnType<typeof createTestPostgres>>;
  let supportId: string;
  let otherId: string;
  let sequence = 0;

  beforeAll(async () => {
    fixture = await createTestPostgres();
    supportId = (
      await fixture.db.tenant.create({
        data: { slug: "suporte_ti", name: "Suporte TI" },
      })
    ).id;
    otherId = (
      await fixture.db.tenant.create({ data: { slug: "outro", name: "Outro" } })
    ).id;
  }, 60_000);
  afterAll(async () => {
    await fixture?.dispose();
  }, 20_000);

  async function addUser(role: Role = "COLLABORATOR", tenantId = supportId) {
    const userId = randomUUID();
    await fixture.db.membership.create({ data: { tenantId, userId, role } });
    return { userId, tenantId, role };
  }

  async function item(
    status: EquipmentStatus = "AVAILABLE",
    tenantId = supportId,
  ) {
    return fixture.db.equipment.create({
      data: {
        tenantId,
        assetTag: `T-${String(++sequence).padStart(5, "0")}`,
        name: "Notebook de teste",
        category: "Notebook",
        status,
      },
    });
  }

  async function loan(
    userId: string,
    options: { returned?: boolean; overdue?: boolean; tenantId?: string } = {},
  ) {
    const tenantId = options.tenantId ?? supportId;
    const equipment = await item(
      options.returned ? "AVAILABLE" : "LOANED",
      tenantId,
    );
    return fixture.db.loan.create({
      data: {
        tenantId,
        userId,
        equipmentId: equipment.id,
        issuedAt: new Date("2026-08-01T12:00:00Z"),
        dueAt: options.overdue
          ? new Date(instant.getTime() - 1)
          : calculateDueAt(instant),
        returnedAt: options.returned ? new Date("2026-08-03T12:00:00Z") : null,
      },
    });
  }

  function context(userId: string | null) {
    return createContext({
      database: fixture.db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: userId ? { id: userId } : null },
            error: null,
          }),
        },
      },
    });
  }

  async function caller(userId: string | null) {
    return appRouter.createCaller(await context(userId));
  }

  it("CA-07 CA-11 exige sessão e Membership nas três procedures", async () => {
    for (const userId of [
      null,
      randomUUID(),
      (await addUser("ADMIN", otherId)).userId,
    ]) {
      const api = await caller(userId);
      const code = userId === null ? "UNAUTHORIZED" : "FORBIDDEN";
      await expect(api.equipment.list()).rejects.toMatchObject({ code });
      await expect(api.loans.mine()).rejects.toMatchObject({ code });
      await expect(
        api.loans.request({ equipmentId: randomUUID() }),
      ).rejects.toMatchObject({ code });
    }
  });

  it("CA-01 CA-07 lista estados, pagina sem repetir e recusa cursor de outro tenant", async () => {
    const user = await addUser();
    const available = await item();
    const maintenance = await item("MAINTENANCE");
    const borrowed = await item("LOANED");
    const foreign = await item("AVAILABLE", otherId);
    const api = await caller(user.userId);
    const first = await api.equipment.list({ limit: 2 });
    const second = await api.equipment.list({
      limit: 2,
      cursor: first.nextCursor!,
    });
    const all = [...first.items, ...second.items];
    expect(all.map((row) => row.id)).toEqual([
      available.id,
      maintenance.id,
      borrowed.id,
    ]);
    expect(all.map((row) => row.status)).toEqual([
      "AVAILABLE",
      "MAINTENANCE",
      "LOANED",
    ]);
    expect(second.nextCursor).toBeNull();
    expect(all.some((row) => row.id === foreign.id)).toBe(false);
    await expect(
      api.equipment.list({ cursor: foreign.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("CA-02 CA-04 cria imediatamente Loan, situação e evento com datas do servidor", async () => {
    const user = await addUser();
    const equipment = await item();
    const result = await requestLoan(fixture.db, user, equipment.id, instant);
    expect(result).toMatchObject({
      equipmentId: equipment.id,
      issuedAt: instant,
      dueAt: new Date("2026-10-01T12:34:56.789Z"),
      returnedAt: null,
    });
    expect(
      await fixture.db.loan.findUnique({ where: { id: result.id } }),
    ).toMatchObject({ userId: user.userId, tenantId: supportId });
    expect(
      (
        await fixture.db.equipment.findUniqueOrThrow({
          where: { id: equipment.id },
        })
      ).status,
    ).toBe("LOANED");
    expect(
      await fixture.db.auditEvent.findMany({
        where: { resourceId: result.id },
      }),
    ).toMatchObject([
      { actorId: user.userId, tenantId: supportId, action: "loan.created" },
    ]);
  });

  it.each(["COLLABORATOR", "ADMIN"] as const)(
    "CA-03 CA-11 aplica limite três a %s e ignora devolvidos",
    async (role) => {
      const user = await addUser(role);
      await loan(user.userId);
      await loan(user.userId);
      await loan(user.userId, { returned: true, overdue: true });
      const third = await item();
      await expect(
        requestLoan(fixture.db, user, third.id, instant),
      ).resolves.toMatchObject({ equipmentId: third.id });
      const fourth = await item();
      await expect(
        requestLoan(fixture.db, user, fourth.id, instant),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "Você já possui três empréstimos em aberto.",
      });
      expect(
        await fixture.db.loan.count({
          where: { userId: user.userId, returnedAt: null },
        }),
      ).toBe(3);
      expect(
        (
          await fixture.db.equipment.findUniqueOrThrow({
            where: { id: fourth.id },
          })
        ).status,
      ).toBe("AVAILABLE");
    },
  );

  it("CA-03 bloqueia atraso e mantém disponível o item recusado", async () => {
    const user = await addUser();
    await loan(user.userId, { overdue: true });
    const equipment = await item();
    await expect(
      requestLoan(fixture.db, user, equipment.id, instant),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Devolva os itens atrasados antes de solicitar outro.",
    });
    expect(
      await fixture.db.loan.count({ where: { equipmentId: equipment.id } }),
    ).toBe(0);
    expect(
      (
        await fixture.db.equipment.findUniqueOrThrow({
          where: { id: equipment.id },
        })
      ).status,
    ).toBe("AVAILABLE");
  });

  it.each(["MAINTENANCE", "LOANED"] as const)(
    "CA-05 recusa %s sem criar empréstimo ou evento",
    async (status) => {
      const user = await addUser();
      const equipment = await item(status);
      const events = await fixture.db.auditEvent.count();
      await expect(
        requestLoan(fixture.db, user, equipment.id, instant),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(
        await fixture.db.loan.count({ where: { equipmentId: equipment.id } }),
      ).toBe(0);
      expect(await fixture.db.auditEvent.count()).toBe(events);
      expect(
        (
          await fixture.db.equipment.findUniqueOrThrow({
            where: { id: equipment.id },
          })
        ).status,
      ).toBe(status);
    },
  );

  it("CA-05 CA-07 trata item inexistente e de outro tenant sem revelar nem alterar dados", async () => {
    const user = await addUser();
    const foreign = await item("AVAILABLE", otherId);
    for (const id of [randomUUID(), foreign.id]) {
      await expect(
        requestLoan(fixture.db, user, id, instant),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Equipamento não encontrado.",
      });
    }
    expect(
      (
        await fixture.db.equipment.findUniqueOrThrow({
          where: { id: foreign.id },
        })
      ).status,
    ).toBe("AVAILABLE");
    expect(
      await fixture.db.loan.count({ where: { equipmentId: foreign.id } }),
    ).toBe(0);
  });

  it("CA-06 duas solicitações simultâneas do mesmo item produzem um Loan e um evento", async () => {
    const a = await addUser();
    const b = await addUser("ADMIN");
    const equipment = await item();
    const results = await Promise.allSettled([
      requestLoan(fixture.db, a, equipment.id, instant),
      requestLoan(fixture.db, b, equipment.id, instant),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const failure = results.find((result) => result.status === "rejected");
    expect(
      failure?.status === "rejected" ? failure.reason : null,
    ).toMatchObject({ code: "CONFLICT" });
    const loans = await fixture.db.loan.findMany({
      where: { equipmentId: equipment.id },
    });
    expect(loans).toHaveLength(1);
    expect(
      await fixture.db.auditEvent.count({ where: { resourceId: loans[0].id } }),
    ).toBe(1);
  }, 30_000);

  it("CA-06 solicitações simultâneas de itens diferentes não ultrapassam três", async () => {
    const user = await addUser();
    await loan(user.userId);
    await loan(user.userId);
    const candidates = await Promise.all([item(), item(), item()]);
    const results = await Promise.allSettled(
      candidates.map((equipment) =>
        requestLoan(fixture.db, user, equipment.id, instant),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      await fixture.db.loan.count({
        where: { userId: user.userId, returnedAt: null },
      }),
    ).toBe(3);
    expect(
      await fixture.db.equipment.count({
        where: {
          id: { in: candidates.map((equipment) => equipment.id) },
          status: "LOANED",
        },
      }),
    ).toBe(1);
  }, 30_000);

  it("CA-06 falha real de lock na auditoria reverte Loan e Equipment", async () => {
    const user = await addUser();
    const equipment = await item();
    let signalLocked: () => void = () => {};
    let releaseLock: () => void = () => {};
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve;
    });
    const release = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const blocker = fixture.db.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`LOCK TABLE "AuditEvent" IN ACCESS EXCLUSIVE MODE`;
        signalLocked();
        await release;
      },
      { timeout: 10_000 },
    );
    const database = new PrismaClient({
      datasourceUrl: `${fixture.url}&connection_limit=1`,
    });
    try {
      await Promise.race([locked, blocker]);
      await database.$connect();
      // A dedicated single-connection pool keeps this setting local to the test.
      await database.$executeRaw`SET lock_timeout = '250ms'`;
      await expect(
        requestLoan(database, user, equipment.id, instant),
      ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    } finally {
      releaseLock();
      await blocker;
      await database.$disconnect();
    }
    expect(
      await fixture.db.loan.count({ where: { equipmentId: equipment.id } }),
    ).toBe(0);
    expect(
      (
        await fixture.db.equipment.findUniqueOrThrow({
          where: { id: equipment.id },
        })
      ).status,
    ).toBe("AVAILABLE");
  }, 20_000);

  it("CA-07 CA-08 lista apenas abertos próprios e recusa cursores de outro usuário/tenant", async () => {
    const user = await addUser("ADMIN");
    const otherUser = await addUser();
    const own = await loan(user.userId);
    const ownSecond = await loan(user.userId);
    const returned = await loan(user.userId, { returned: true });
    const other = await loan(otherUser.userId);
    const foreignUser = await addUser("ADMIN", otherId);
    const foreign = await loan(foreignUser.userId, { tenantId: otherId });
    const api = await caller(user.userId);
    const first = await api.loans.mine({ limit: 1 });
    const second = await api.loans.mine({
      limit: 1,
      cursor: first.nextCursor!,
    });
    expect(
      new Set([...first.items, ...second.items].map((row) => row.id)),
    ).toEqual(new Set([own.id, ownSecond.id]));
    expect(second.nextCursor).toBeNull();
    for (const cursor of [returned.id, other.id, foreign.id]) {
      await expect(api.loans.mine({ cursor })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  });

  it("CA-07 HTTP recusa identidade forjada, origem externa e input inválido", async () => {
    const user = await addUser();
    const equipment = await item();
    const handler = createTRPCHandler(() => context(user.userId));
    const request = (json: object, origin = "http://localhost") =>
      new Request("http://localhost/api/trpc/loans.request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ json }),
      });
    const invalid = await handler(
      request({
        equipmentId: equipment.id,
        userId: randomUUID(),
        tenantId: otherId,
        role: "ADMIN",
      }),
    );
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({
      error: {
        json: {
          message: "Solicitação inválida.",
          data: { code: "BAD_REQUEST" },
        },
      },
    });
    const csrf = await handler(
      request({ equipmentId: equipment.id }, "https://outside.example"),
    );
    expect(csrf.status).toBe(403);
    expect(await csrf.json()).toMatchObject({
      error: { json: { data: { code: "FORBIDDEN" } } },
    });
    expect(
      await fixture.db.loan.count({ where: { equipmentId: equipment.id } }),
    ).toBe(0);
  });

  it("CA-02 CA-11 procedure publica somente o Loan próprio sem dados de conexão", async () => {
    const user = await addUser("ADMIN");
    const equipment = await item();
    const api = await caller(user.userId);
    const result = await api.loans.request({ equipmentId: equipment.id });
    expect(result).toMatchObject({
      equipmentId: equipment.id,
      returnedAt: null,
    });
    expect(Object.keys(result).sort()).toEqual([
      "dueAt",
      "equipmentId",
      "id",
      "issuedAt",
      "returnedAt",
    ]);
    expect((await api.loans.mine()).items.map((row) => row.id)).toContain(
      result.id,
    );
  });
});
