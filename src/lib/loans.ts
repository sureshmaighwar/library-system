import type { Prisma, PrismaClient } from "@prisma/client";

import { addDays, calculateFineCents, centsToAmount, LOAN_PERIOD_DAYS } from "@/lib/fines";

export const MAX_ACTIVE_LOANS = 3;

export const OPEN_LOAN_STATUSES = ["ACTIVE", "OVERDUE"] as const;

type LoanDb = PrismaClient;

export class LoanError extends Error {
  readonly status: number;
  readonly code:
    | "NO_COPIES"
    | "LOAN_LIMIT"
    | "DUPLICATE"
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "ALREADY_RENEWED"
    | "NOT_RENEWABLE"
    | "COPIES_AVAILABLE";

  constructor(status: number, code: LoanError["code"], message: string) {
    super(message);
    this.name = "LoanError";
    this.status = status;
    this.code = code;
  }
}

const loanInclude = {
  item: { select: { id: true, title: true, author: true } },
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.LoanInclude;

export type LoanRecord = Prisma.LoanGetPayload<{ include: typeof loanInclude }>;

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/**
 * Flip active loans past their due date to OVERDUE.
 * The fine is still calculated from the dates, not from this label.
 */
export async function markOverdueLoans(db: Pick<PrismaClient, "loan">, now = new Date()) {
  await db.loan.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}

/**
 * Borrow one copy inside a transaction.
 * The member row is locked so the 3-loan cap cannot be exceeded by concurrent requests.
 * Copies drop only when `availableCopies > 0`, so stock cannot go negative.
 */
export async function borrowItem(userId: string, itemId: string, db?: LoanDb): Promise<LoanRecord> {
  const client = db ?? (await import("@/lib/prisma")).prisma;

  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT 1 FROM "users" WHERE "id" = ${userId} FOR UPDATE`;
    await markOverdueLoans(tx);

    const activeCount = await tx.loan.count({
      where: { userId, status: { in: [...OPEN_LOAN_STATUSES] } },
    });
    if (activeCount >= MAX_ACTIVE_LOANS) {
      throw new LoanError(
        409,
        "LOAN_LIMIT",
        "You already have 3 active loans. Return one before borrowing again.",
      );
    }

    const duplicate = await tx.loan.findFirst({
      where: { userId, itemId, status: { in: [...OPEN_LOAN_STATUSES] } },
    });
    if (duplicate) {
      throw new LoanError(409, "DUPLICATE", "You already have this item on loan.");
    }

    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new LoanError(404, "NOT_FOUND", "That item is not in the catalogue.");
    }

    const reserved = await tx.item.updateMany({
      where: { id: itemId, availableCopies: { gt: 0 } },
      data: { availableCopies: { decrement: 1 } },
    });
    if (reserved.count === 0) {
      throw new LoanError(409, "NO_COPIES", "No copies are available right now.");
    }

    const borrowedAt = new Date();
    try {
      const loan = await tx.loan.create({
        data: {
          userId,
          itemId,
          borrowedAt,
          dueDate: addDays(borrowedAt, LOAN_PERIOD_DAYS),
          status: "ACTIVE",
          fineAmount: "0.00",
          finePaid: true,
        },
        include: loanInclude,
      });
      await tx.stockLog.create({
        data: {
          itemId,
          changedBy: userId,
          action: "BORROWED",
          quantity: 1,
        },
      });
      await tx.reservation.updateMany({
        where: { userId, itemId, fulfilledAt: null },
        data: { fulfilledAt: borrowedAt },
      });
      return loan;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new LoanError(409, "DUPLICATE", "You already have this item on loan.");
      }
      throw error;
    }
  });
}

/**
 * Return a loan once. A second return is a no-op and does not add another copy.
 * The fine is calculated from the due date and saved on the loan (R-18).
 */
export async function returnLoan(
  actorId: string,
  loanId: string,
  isLibrarian: boolean,
  db?: LoanDb,
): Promise<{ loan: LoanRecord; idempotent: boolean }> {
  const client = db ?? (await import("@/lib/prisma")).prisma;

  return client.$transaction(async (tx) => {
    await markOverdueLoans(tx);
    const existing = await tx.loan.findUnique({
      where: { id: loanId },
      include: loanInclude,
    });
    if (!existing) {
      throw new LoanError(404, "NOT_FOUND", "Loan not found.");
    }
    if (!isLibrarian && existing.userId !== actorId) {
      throw new LoanError(403, "FORBIDDEN", "You can only return your own loans.");
    }
    if (existing.status === "RETURNED" || existing.returnedAt) {
      return { loan: existing, idempotent: true };
    }

    const returnedAt = new Date();
    const fineCents = calculateFineCents(existing.dueDate, returnedAt);
    const updated = await tx.loan.updateMany({
      where: { id: loanId, status: { in: [...OPEN_LOAN_STATUSES] } },
      data: {
        status: "RETURNED",
        returnedAt,
        fineAmount: centsToAmount(fineCents),
        finePaid: fineCents === 0,
      },
    });

    if (updated.count === 0) {
      const current = await tx.loan.findUnique({
        where: { id: loanId },
        include: loanInclude,
      });
      if (!current) {
        throw new LoanError(404, "NOT_FOUND", "Loan not found.");
      }
      return { loan: current, idempotent: true };
    }

    await tx.item.update({
      where: { id: existing.itemId },
      data: { availableCopies: { increment: 1 } },
    });
    await tx.stockLog.create({
      data: {
        itemId: existing.itemId,
        changedBy: actorId,
        action: "RETURNED",
        quantity: 1,
      },
    });

    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: loanInclude,
    });
    if (!loan) {
      throw new LoanError(404, "NOT_FOUND", "Loan not found.");
    }

    return { loan, idempotent: false };
  });
}

/**
 * Extend an active loan once, by 14 days from today.
 * Overdue loans and loans that were already renewed cannot be renewed.
 */
export async function renewLoan(actorId: string, loanId: string, db?: LoanDb): Promise<LoanRecord> {
  const client = db ?? (await import("@/lib/prisma")).prisma;

  return client.$transaction(async (tx) => {
    await markOverdueLoans(tx);
    const existing = await tx.loan.findUnique({ where: { id: loanId }, include: loanInclude });
    if (!existing) {
      throw new LoanError(404, "NOT_FOUND", "Loan not found.");
    }
    if (existing.userId !== actorId) {
      throw new LoanError(403, "FORBIDDEN", "You can only renew your own loans.");
    }
    if (existing.renewed) {
      throw new LoanError(409, "ALREADY_RENEWED", "This loan has already been renewed once.");
    }
    if (existing.status !== "ACTIVE") {
      throw new LoanError(409, "NOT_RENEWABLE", "Only an active loan that is not overdue can be renewed.");
    }

    return tx.loan.update({
      where: { id: loanId },
      data: {
        dueDate: addDays(new Date(), LOAN_PERIOD_DAYS),
        renewed: true,
      },
      include: loanInclude,
    });
  });
}

/** Join the queue for an item that has no copies left. */
export async function reserveItem(userId: string, itemId: string, db?: LoanDb) {
  const client = db ?? (await import("@/lib/prisma")).prisma;

  return client.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new LoanError(404, "NOT_FOUND", "That item is not in the catalogue.");
    }
    if (item.availableCopies > 0) {
      throw new LoanError(409, "COPIES_AVAILABLE", "Copies are available. Borrow the item instead.");
    }

    const existing = await tx.reservation.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existing && !existing.fulfilledAt) {
      throw new LoanError(409, "DUPLICATE", "You are already in the queue for this item.");
    }

    const latest = await tx.reservation.findFirst({
      where: { itemId, fulfilledAt: null },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = (latest?.position ?? 0) + 1;

    if (existing) {
      return tx.reservation.update({
        where: { id: existing.id },
        data: { position, fulfilledAt: null, createdAt: new Date() },
      });
    }

    return tx.reservation.create({
      data: { userId, itemId, position },
    });
  });
}

/** Librarian marks a saved fine as paid. A zero fine is already paid. */
export async function markFinePaid(loanId: string, db?: LoanDb): Promise<LoanRecord> {
  const client = db ?? (await import("@/lib/prisma")).prisma;
  const existing = await client.loan.findUnique({ where: { id: loanId }, include: loanInclude });
  if (!existing) {
    throw new LoanError(404, "NOT_FOUND", "Loan not found.");
  }
  if (existing.status !== "RETURNED") {
    throw new LoanError(409, "NOT_RENEWABLE", "Pay the fine when the item has been returned.");
  }

  return client.loan.update({
    where: { id: loanId },
    data: { finePaid: true },
    include: loanInclude,
  });
}
