import { describe, expect, it } from "vitest";
import { calculateDueAt } from "./loan-policy";
import {
  isNationalBusinessDay,
  nationalHolidayDates,
} from "./business-calendar";

describe("CA-04 — calendário nacional e prazo inclusivo", () => {
  it.each([
    ["2026-09-14T12:34:56.789Z", "2026-10-01T12:34:56.789Z"],
    ["2026-11-14T12:34:56.789Z", "2026-12-04T12:34:56.789Z"],
    ["2026-12-25T12:34:56.789Z", "2027-01-15T12:34:56.789Z"],
    ["2026-04-02T12:34:56.789Z", "2026-04-23T12:34:56.789Z"],
    ["2026-02-16T12:34:56.789Z", "2026-03-05T12:34:56.789Z"],
    ["2026-06-04T12:34:56.789Z", "2026-06-23T12:34:56.789Z"],
    // UTC Saturday is still Friday evening in São Paulo: issuance counts.
    ["2026-11-14T01:34:56.789Z", "2026-12-04T01:34:56.789Z"],
  ])("conta a partir de %s e vence em %s", (issued, expected) => {
    const input = new Date(issued);
    expect(calculateDueAt(input).toISOString()).toBe(expected);
    expect(input.toISOString()).toBe(issued);
  });

  it("inclui os dez feriados do calendário nacional de 2026", () => {
    expect([...nationalHolidayDates(2026)].sort()).toEqual([
      "2026-01-01",
      "2026-04-03",
      "2026-04-21",
      "2026-05-01",
      "2026-09-07",
      "2026-10-12",
      "2026-11-02",
      "2026-11-15",
      "2026-11-20",
      "2026-12-25",
    ]);
  });

  it("exclui fim de semana e feriado, mas mantém pontos facultativos úteis", () => {
    expect(isNationalBusinessDay(new Date("2026-11-20T15:00:00Z"))).toBe(false);
    expect(isNationalBusinessDay(new Date("2026-11-21T15:00:00Z"))).toBe(false);
    expect(isNationalBusinessDay(new Date("2026-02-17T15:00:00Z"))).toBe(true);
    expect(isNationalBusinessDay(new Date("2026-06-04T15:00:00Z"))).toBe(true);
  });

  it("não calcula silenciosamente fora da cobertura ou com data inválida", () => {
    expect(() => calculateDueAt(new Date("2031-01-05T15:00:00Z"))).toThrow(
      "atualizado",
    );
    expect(() => calculateDueAt(new Date("2030-12-30T15:00:00Z"))).toThrow(
      "atualizado",
    );
    expect(() => calculateDueAt(new Date("invalid"))).toThrow("inválida");
  });
});
