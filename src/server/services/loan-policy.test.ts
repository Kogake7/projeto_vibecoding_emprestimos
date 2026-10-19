import { describe, expect, it } from "vitest";
import { assertCanBorrow, calculateDueAt, isOverdue } from "./loan-policy";

const now = new Date("2026-09-14T12:00:00Z");
const open = { dueAt: calculateDueAt(now), returnedAt: null };

describe("política de empréstimos", () => {
  it("permite o terceiro item", () =>
    expect(() =>
      assertCanBorrow("AVAILABLE", [open, open], now),
    ).not.toThrow());
  it("bloqueia o quarto item", () =>
    expect(() => assertCanBorrow("AVAILABLE", [open, open, open], now)).toThrow(
      "três",
    ));
  it.each(["MAINTENANCE", "LOANED"] as const)(
    "bloqueia equipamento %s",
    (status) =>
      expect(() => assertCanBorrow(status, [], now)).toThrow("disponível"),
  );
  it("bloqueia um atraso de um milissegundo", () =>
    expect(() =>
      assertCanBorrow(
        "AVAILABLE",
        [{ dueAt: new Date(now.getTime() - 1), returnedAt: null }],
        now,
      ),
    ).toThrow("atrasados"));
  it("ignora empréstimos já devolvidos no limite e no atraso", () => {
    const returned = { dueAt: new Date("2026-08-01"), returnedAt: now };
    expect(() =>
      assertCanBorrow("AVAILABLE", [returned, returned, returned], now),
    ).not.toThrow();
  });
  it("não considera atraso no instante exato do vencimento", () =>
    expect(isOverdue({ dueAt: now, returnedAt: null }, now)).toBe(false));
  it("calcula 14 dias atravessando mês e ano sem alterar a entrada", () => {
    const issued = new Date("2026-12-25T12:00:00Z");
    expect(calculateDueAt(issued).toISOString()).toBe(
      "2027-01-08T12:00:00.000Z",
    );
    expect(issued.toISOString()).toBe("2026-12-25T12:00:00.000Z");
  });
});
