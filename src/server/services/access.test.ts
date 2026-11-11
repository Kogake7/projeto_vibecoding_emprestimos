import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveAccess } from "./access";
import { createTestPostgres } from "../../test-support/postgres";

describe("T-04 — acesso limitado a suporte_ti em PostgreSQL real", () => {
  let fixture: Awaited<ReturnType<typeof createTestPostgres>>;
  let supportId: string;
  let otherId: string;

  beforeAll(async () => {
    fixture = await createTestPostgres();
    supportId = (
      await fixture.db.tenant.create({
        data: { slug: "suporte_ti", name: "Suporte TI" },
      })
    ).id;
    otherId = (
      await fixture.db.tenant.create({
        data: { slug: "outra_area", name: "Outra área" },
      })
    ).id;
  }, 60_000);

  afterAll(async () => {
    await fixture?.dispose();
  }, 20_000);

  it("CA-05 recusa ausência de identidade antes de inicializar o banco", async () => {
    await expect(resolveAccess(null)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Autenticação necessária.",
    });
  });

  it("CA-05 recusa pessoa sem vínculo com mensagem genérica", async () => {
    await expect(
      resolveAccess({ id: randomUUID() }, fixture.db),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Acesso não permitido.",
    });
  });

  it.each(["COLLABORATOR", "ADMIN"] as const)(
    "CA-07 resolve %s da Membership persistida sem retornar tokens",
    async (role) => {
      const userId = randomUUID();
      await fixture.db.membership.create({
        data: { userId, tenantId: supportId, role },
      });
      const identity = {
        id: userId,
        role: "ignorado",
        access_token: "fixture",
      };

      await expect(resolveAccess(identity, fixture.db)).resolves.toEqual({
        userId,
        tenantId: supportId,
        role,
      });
    },
  );

  it("CA-06 não usa a Membership de outra pessoa do mesmo tenant", async () => {
    await fixture.db.membership.create({
      data: { userId: randomUUID(), tenantId: supportId, role: "ADMIN" },
    });

    await expect(
      resolveAccess({ id: randomUUID() }, fixture.db),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("CA-05 CA-06 recusa ADMIN vinculado somente a outro tenant", async () => {
    const userId = randomUUID();
    await fixture.db.membership.create({
      data: { userId, tenantId: otherId, role: "ADMIN" },
    });

    await expect(
      resolveAccess({ id: userId }, fixture.db),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Acesso não permitido.",
    });
  });

  it("CA-07 CA-11 ignora ADMIN de outra área e dados extras de papel/tenant", async () => {
    const userId = randomUUID();
    await fixture.db.membership.createMany({
      data: [
        { userId, tenantId: otherId, role: "ADMIN" },
        { userId, tenantId: supportId, role: "COLLABORATOR" },
      ],
    });
    const identity = { id: userId, role: "ADMIN", tenantId: otherId };

    await expect(resolveAccess(identity, fixture.db)).resolves.toEqual({
      userId,
      tenantId: supportId,
      role: "COLLABORATOR",
    });
  });

  it("CA-11 não reduz ADMIN de suporte_ti por vínculo de colaborador em outra área", async () => {
    const userId = randomUUID();
    await fixture.db.membership.createMany({
      data: [
        { userId, tenantId: otherId, role: "COLLABORATOR" },
        { userId, tenantId: supportId, role: "ADMIN" },
      ],
    });

    await expect(resolveAccess({ id: userId }, fixture.db)).resolves.toEqual({
      userId,
      tenantId: supportId,
      role: "ADMIN",
    });
  });

  it("CA-07 consulta o papel atual do banco após alteração da Membership", async () => {
    const userId = randomUUID();
    const where = { tenantId_userId: { tenantId: supportId, userId } };
    await fixture.db.membership.create({
      data: { userId, tenantId: supportId, role: "ADMIN" },
    });
    expect((await resolveAccess({ id: userId }, fixture.db)).role).toBe(
      "ADMIN",
    );
    await fixture.db.membership.update({
      where,
      data: { role: "COLLABORATOR" },
    });

    expect((await resolveAccess({ id: userId }, fixture.db)).role).toBe(
      "COLLABORATOR",
    );
  });

  it("CA-05 falha fechada com erro genérico quando o banco está indisponível", async () => {
    const unavailable = new PrismaClient({
      datasourceUrl:
        "postgresql://fixture:fixture@127.0.0.1:1/access_test?connect_timeout=1",
    });
    try {
      await expect(
        resolveAccess({ id: randomUUID() }, unavailable),
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Não foi possível verificar o acesso.",
        cause: undefined,
      });
    } finally {
      await unavailable.$disconnect();
    }
  });

  it("CA-05 não revela se o tenant suporte_ti está ausente", async () => {
    const userId = randomUUID();
    await fixture.db.membership.create({
      data: { userId, tenantId: supportId, role: "ADMIN" },
    });
    await fixture.db.tenant.update({
      where: { id: supportId },
      data: { slug: "suporte_ti_indisponivel" },
    });
    try {
      await expect(
        resolveAccess({ id: userId }, fixture.db),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Acesso não permitido.",
      });
    } finally {
      await fixture.db.tenant.update({
        where: { id: supportId },
        data: { slug: "suporte_ti" },
      });
    }
  });
});
