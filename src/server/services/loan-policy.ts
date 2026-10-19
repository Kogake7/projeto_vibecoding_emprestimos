import type { EquipmentStatus } from "@prisma/client";

export const MAX_OPEN_LOANS = 3;
export const LOAN_DURATION_DAYS = 14;

export type LoanDates = { dueAt: Date; returnedAt: Date | null };

export class LoanPolicyError extends Error {
  constructor(
    public readonly code: "UNAVAILABLE" | "OVERDUE" | "LIMIT_REACHED",
  ) {
    super(
      {
        UNAVAILABLE: "Este equipamento não está disponível.",
        OVERDUE: "Devolva os itens atrasados antes de solicitar outro.",
        LIMIT_REACHED: "Você já possui três empréstimos em aberto.",
      }[code],
    );
    this.name = "LoanPolicyError";
  }
}

export function isOverdue(loan: LoanDates, now: Date): boolean {
  return loan.returnedAt === null && loan.dueAt.getTime() < now.getTime();
}

export function assertCanBorrow(
  status: EquipmentStatus,
  loans: readonly LoanDates[],
  now: Date,
): void {
  if (status !== "AVAILABLE") throw new LoanPolicyError("UNAVAILABLE");
  const open = loans.filter((loan) => loan.returnedAt === null);
  if (open.some((loan) => isOverdue(loan, now)))
    throw new LoanPolicyError("OVERDUE");
  if (open.length >= MAX_OPEN_LOANS) throw new LoanPolicyError("LIMIT_REACHED");
}

// Fourteen complete days from issuance, stored as an absolute UTC instant.
export function calculateDueAt(issuedAt: Date): Date {
  return new Date(
    issuedAt.getTime() + LOAN_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );
}
