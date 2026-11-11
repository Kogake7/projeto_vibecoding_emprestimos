import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { RouterOutputs } from "../server/api/root";
import { TRPCProvider } from "../trpc/react";
import EquipmentWorkspace, {
  EquipmentCard,
  OpenLoanCard,
} from "./equipment-workspace";

vi.mock("../shared/equipment-images", () => ({
  getEquipmentImage: () => undefined,
}));

const equipment: RouterOutputs["equipment"]["list"]["items"][number] = {
  id: "00000000-0000-4000-8000-000000000001",
  assetTag: "TI-0001",
  name: "Notebook para trabalho",
  category: "Notebook",
  status: "AVAILABLE",
};
const loan: RouterOutputs["loans"]["mine"]["items"][number] = {
  id: "00000000-0000-4000-8000-000000000002",
  equipmentId: equipment.id,
  issuedAt: new Date("2026-11-11T15:00:00.000Z"),
  dueAt: new Date("2026-12-01T15:00:00.000Z"),
  returnedAt: null,
  equipment,
};

function renderEquipment(
  overrides: Partial<Parameters<typeof EquipmentCard>[0]> = {},
) {
  return renderToStaticMarkup(
    createElement(EquipmentCard, {
      equipment,
      isSending: false,
      onRequest: () => undefined,
      ...overrides,
    }),
  );
}

describe("spec 003 — apresentação e bloqueios do catálogo", () => {
  it("CA-09 CA-11 aguarda identidade antes de apresentar dados do catálogo", () => {
    const html = renderToStaticMarkup(
      createElement(TRPCProvider, null, createElement(EquipmentWorkspace)),
    );
    expect(html).toContain("Verificando seu acesso…");
    expect(html).not.toContain("Foto pendente");
    expect(html).not.toContain("Solicitar empréstimo");
  });

  it.each(["MAINTENANCE", "LOANED"] as const)(
    "CA-01 CA-05 conserva item %s visível com pedido desabilitado e motivo acessível",
    (status) => {
      const html = renderEquipment({ equipment: { ...equipment, status } });
      const button = html.match(/<button\b[^>]*>/)?.[0];
      expect(html).toContain(equipment.assetTag);
      expect(html).toContain(equipment.name);
      expect(html).toContain(
        status === "MAINTENANCE" ? "Em manutenção" : "Emprestado",
      );
      expect(button).toContain('disabled=""');
      expect(button).toContain(`aria-describedby="reason-${equipment.id}"`);
      expect(html).not.toContain('text-emerald-900">Disponível');
    },
  );

  it("CA-03 CA-09 item disponível respeita bloqueio pessoal informado pela consulta", () => {
    const reason = "Você atingiu o limite de três empréstimos em aberto.";
    const html = renderEquipment({ disabledReason: reason });
    expect(html.match(/<button\b[^>]*>/)?.[0]).toContain('disabled=""');
    expect(html).toContain(reason);
  });

  it("CA-09 envio desabilita o botão e comunica a solicitação em andamento", () => {
    const html = renderEquipment({ isSending: true });
    expect(html.match(/<button\b[^>]*>/)?.[0]).toContain('disabled=""');
    expect(html).toContain("Solicitando…");
  });

  it("CA-10 informa foto pendente sem inventar uma foto de equipamento", () => {
    const html = renderEquipment();
    expect(html).toContain("Foto pendente");
    expect(html).not.toMatch(/<img\b/);
  });
});

describe("spec 003 — datas dos empréstimos próprios", () => {
  it("CA-08 mostra solicitação e vencimento no horário de São Paulo", () => {
    const html = renderToStaticMarkup(
      createElement(OpenLoanCard, { loan, now: loan.issuedAt.getTime() }),
    );
    expect(html).toContain("11/11/2026, 12:00");
    expect(html).toContain("01/12/2026, 12:00");
    expect(html).toMatch(/datetime="2026-12-01T15:00:00\.000Z"/i);
  });

  it("CA-03 CA-08 atraso começa somente após o vencimento exato", () => {
    const exact = renderToStaticMarkup(
      createElement(OpenLoanCard, { loan, now: loan.dueAt.getTime() }),
    );
    const after = renderToStaticMarkup(
      createElement(OpenLoanCard, { loan, now: loan.dueAt.getTime() + 1 }),
    );
    expect(exact).toContain("Em andamento");
    expect(exact).not.toContain("Em atraso");
    expect(after).toContain("Em atraso");
    expect(after).toContain("Procure Operações");
  });
});
