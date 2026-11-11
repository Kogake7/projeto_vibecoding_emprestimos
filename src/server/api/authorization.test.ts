import { randomUUID } from "node:crypto";
import type { Role } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

import { createTestPostgres } from "../../test-support/postgres";
import { createContext } from "./context";
import { createTRPCHandler } from "./handler";
import { appRouter } from "./root";
import {
  adminProcedure,
  protectedProcedure,
  router,
  tenantProcedure,
} from "./trpc";

// Procedures de prova não são publicadas no AppRouter da aplicação.
const proofRouter = router({
  identity: protectedProcedure
    .input(z.undefined())
    .query(({ ctx }) => ctx.identity.id),
  collaborator: tenantProcedure.input(z.undefined()).query(({ ctx }) => ({
    userId: ctx.userId,
    tenantId: ctx.tenantId,
    role: ctx.role,
  })),
  admin: adminProcedure.input(z.undefined()).query(({ ctx }) => ctx.role),
  changeTenantName: adminProcedure
    .input(z.strictObject({ name: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.tenant.update({
        where: { id: ctx.tenantId },
        data: { name: input.name },
        select: { id: true, name: true },
      }),
    ),
});

describe("T-05 — contexto e autorização tRPC em PostgreSQL real", () => {
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

  async function addUser(supportRole?: Role, otherRole?: Role) {
    const id = randomUUID();
    if (supportRole)
      await fixture.db.membership.create({
        data: { userId: id, tenantId: supportId, role: supportRole },
      });
    if (otherRole)
      await fixture.db.membership.create({
        data: { userId: id, tenantId: otherId, role: otherRole },
      });
    return id;
  }

  function contextFor(id: string | null) {
    return createContext({
      database: fixture.db,
      authClient: {
        auth: {
          getUser: async () => ({
            data: { user: id ? { id } : null },
            error: null,
          }),
        },
      },
    });
  }

  function requestFor(path = "auth.me", input?: object) {
    const url = new URL(`http://localhost/api/trpc/${path}`);
    if (input) url.searchParams.set("input", JSON.stringify({ json: input }));
    return new Request(url);
  }

  it("CA-05 protectedProcedure recusa identidade ausente", async () => {
    const caller = proofRouter.createCaller(await contextFor(null));
    await expect(caller.identity()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.collaborator()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller.admin()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("CA-05 separa identidade validada de vínculo autorizado no tenant", async () => {
    const id = randomUUID();
    const ctx = await contextFor(id);
    await expect(proofRouter.createCaller(ctx).identity()).resolves.toBe(id);
    await expect(appRouter.createCaller(ctx).auth.me()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it.each(["COLLABORATOR", "ADMIN"] as const)(
    "CA-07 CA-10 aceita %s na função de colaborador",
    async (role) => {
      const id = await addUser(role);
      const caller = proofRouter.createCaller(await contextFor(id));
      await expect(caller.collaborator()).resolves.toEqual({
        userId: id,
        tenantId: supportId,
        role,
      });
    },
  );

  it("CA-09 impede leitura e mutação administrativa por colaborador", async () => {
    const id = await addUser("COLLABORATOR");
    const before = await fixture.db.tenant.findUniqueOrThrow({
      where: { id: supportId },
    });
    const caller = proofRouter.createCaller(await contextFor(id));
    await expect(caller.admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.changeTenantName({ name: "Não permitido" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      (await fixture.db.tenant.findUniqueOrThrow({ where: { id: supportId } }))
        .name,
    ).toBe(before.name);
  });

  it("CA-06 CA-10 permite ADMIN somente no tenant resolvido pelo servidor", async () => {
    const id = await addUser("ADMIN");
    const otherBefore = await fixture.db.tenant.findUniqueOrThrow({
      where: { id: otherId },
    });
    const caller = proofRouter.createCaller(await contextFor(id));
    await expect(caller.admin()).resolves.toBe("ADMIN");
    await expect(
      caller.changeTenantName({ name: "Nome de prova" }),
    ).resolves.toEqual({ id: supportId, name: "Nome de prova" });
    expect(
      (await fixture.db.tenant.findUniqueOrThrow({ where: { id: otherId } }))
        .name,
    ).toBe(otherBefore.name);
  });

  it("CA-05 CA-06 rejeita ADMIN vinculado apenas a outra área", async () => {
    const id = await addUser(undefined, "ADMIN");
    const caller = proofRouter.createCaller(await contextFor(id));
    await expect(caller.admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller.changeTenantName({ name: "Recusado" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("CA-09 CA-11 não promove colaborador por ADMIN em outro tenant", async () => {
    const id = await addUser("COLLABORATOR", "ADMIN");
    const ctx = await contextFor(id);
    await expect(appRouter.createCaller(ctx).auth.me()).resolves.toEqual({
      userId: id,
      tenantId: supportId,
      role: "COLLABORATOR",
    });
    await expect(proofRouter.createCaller(ctx).admin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("CA-10 CA-11 mantém ADMIN do tenant correto com vínculo em várias áreas", async () => {
    const id = await addUser("ADMIN", "COLLABORATOR");
    await expect(
      proofRouter.createCaller(await contextFor(id)).admin(),
    ).resolves.toBe("ADMIN");
  });

  it("CA-07 não reaproveita papel de uma requisição anterior", async () => {
    const id = await addUser("ADMIN");
    await expect(
      proofRouter.createCaller(await contextFor(id)).admin(),
    ).resolves.toBe("ADMIN");
    await fixture.db.membership.update({
      where: { tenantId_userId: { tenantId: supportId, userId: id } },
      data: { role: "COLLABORATOR" },
    });
    await expect(
      proofRouter.createCaller(await contextFor(id)).admin(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("CA-07 verifica identidade uma vez e compartilha resolução apenas na requisição", async () => {
    const id = await addUser("COLLABORATOR");
    const getUser = vi.fn(async () => ({
      data: { user: { id } },
      error: null,
    }));
    const ctx = await createContext({
      database: fixture.db,
      authClient: { auth: { getUser } },
    });
    const first = ctx.getAccess();
    expect(ctx.getAccess()).toBe(first);
    await first;
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("CA-05 HTTP retorna 401 e corpo genérico sem identidade", async () => {
    const response = await createTRPCHandler(() => contextFor(null))(
      requestFor(),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: {
        json: {
          message: "Autenticação necessária.",
          data: { code: "UNAUTHORIZED", httpStatus: 401 },
        },
      },
    });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Vary")).toContain("Cookie");
  });

  it("CA-05 HTTP retorna 403 quando há identidade sem Membership", async () => {
    const response = await createTRPCHandler(() => contextFor(randomUUID()))(
      requestFor(),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        json: {
          message: "Acesso não permitido.",
          data: { code: "FORBIDDEN", httpStatus: 403 },
        },
      },
    });
  });

  it("CA-07 HTTP retorna somente o contexto próprio com cache privado", async () => {
    const id = await addUser("COLLABORATOR");
    const response = await createTRPCHandler(() => contextFor(id))(
      requestFor(),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: {
        data: {
          json: {
            userId: id,
            tenantId: supportId,
            role: "COLLABORATOR",
          },
        },
      },
    });
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("CA-06 CA-07 CA-09 HTTP recusa falsificação de usuário, tenant e papel no input", async () => {
    const id = await addUser("COLLABORATOR");
    const response = await createTRPCHandler(() => contextFor(id))(
      requestFor("auth.me", {
        userId: randomUUID(),
        tenantId: otherId,
        role: "ADMIN",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        json: {
          message: "Solicitação inválida.",
          data: { code: "BAD_REQUEST", httpStatus: 400 },
        },
      },
    });
  });

  it("CA-05 HTTP não concede acesso por cabeçalhos de identidade/papel", async () => {
    const request = new Request("http://localhost/api/trpc/auth.me", {
      headers: {
        "x-user-id": randomUUID(),
        "x-tenant-id": supportId,
        "x-role": "ADMIN",
      },
    });
    const response = await createTRPCHandler(() => contextFor(null))(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: { json: { data: { code: "UNAUTHORIZED" } } },
    });
  });

  it("CA-05 HTTP sanitiza exceção do provedor sem stack ou detalhes internos", async () => {
    const response = await createTRPCHandler(() =>
      createContext({
        database: fixture.db,
        authClient: {
          auth: {
            getUser: async () => {
              throw new Error("fixture-sensitive-provider-detail");
            },
          },
        },
      }),
    )(requestFor());
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toContain("Não foi possível concluir a solicitação.");
    expect(body).not.toContain("fixture-sensitive-provider-detail");
    expect(body).not.toContain("stack");
    expect(body).not.toContain("cause");
  });
});
