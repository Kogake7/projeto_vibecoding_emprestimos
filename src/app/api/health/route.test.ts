import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createHealthResponse } from "../../../server/health";

describe("GET /api/health", () => {
  it("AZ-04 retorna 200 e confirma a conexão", async () => {
    const response = await createHealthResponse(async () => [{ result: 1 }]);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      database: "connected",
    });
  });

  it("AZ-02 retorna erro claro quando o banco está indisponível", async () => {
    const response = await createHealthResponse(async () => {
      throw new Error("offline");
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      database: "unavailable",
    });
  });
});
