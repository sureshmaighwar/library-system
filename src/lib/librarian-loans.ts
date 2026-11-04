import type { LoanStatus, Prisma } from "@prisma/client";

import { calculateFineCents } from "@/lib/fines";
import { markOverdueLoans } from "@/lib/loans";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type LoanListStatus = "all" | "active" | "returned" | "overdue";

export type LibrarianLoan = {
  id: string;
  status: LoanStatus;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  fineAmount: number;
  finePaid: boolean;
  daysOverdue: number;
  currentFine: number;
  user: { id: string; name: string; email: string };
  item: { id: string; title: string; author: string };
};

const loanInclude = {
  user: { select: { id: true, name: true, email: true } },
  item: { select: { id: true, title: true, author: true } },
} satisfies Prisma.LoanInclude;

type LoanRow = Prisma.LoanGetPayload<{ include: typeof loanInclude }>;

/**
 * Loans for the librarian desk. Late active loans are marked OVERDUE first,
 * so an overdue loan is one that is still out and past its due date.
 */
export async function listLibrarianLoans(filters: { status: LoanListStatus; search: string }, now = new Date()) {
  await markOverdueLoans(prisma, now);
  const where = loanWhere(filters, now);
  const rows = await prisma.loan.findMany({
    where,
    include: loanInclude,
    orderBy: { borrowedAt: "desc" },
  });
  return rows.map((loan) => toLibrarianLoan(loan, now));
}

/** Overdue loans plus the count and the fines those loans currently owe. */
export async function listOverdueLoans(now = new Date()) {
  const loans = await listLibrarianLoans({ status: "overdue", search: "" }, now);
  const totalFineCents = loans.reduce((sum, loan) => sum + Math.round(loan.currentFine * 100), 0);
  return {
    loans,
    totalOverdue: loans.length,
    totalFines: totalFineCents / 100,
  };
}

function loanWhere(filters: { status: LoanListStatus; search: string }, now: Date): Prisma.LoanWhereInput {
  const where: Prisma.LoanWhereInput = {};
  if (filters.status === "active") {
    where.status = "ACTIVE";
  } else if (filters.status === "returned") {
    where.status = "RETURNED";
  } else if (filters.status === "overdue") {
    where.OR = [{ status: "OVERDUE" }, { status: "ACTIVE", dueDate: { lt: now } }];
  }

  const search = filters.search.trim();
  if (search) {
    where.AND = [
      {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" } } },
          { item: { title: { contains: search, mode: "insensitive" } } },
        ],
      },
    ];
  }
  return where;
}

function toLibrarianLoan(loan: LoanRow, now: Date): LibrarianLoan {
  const open = loan.status === "ACTIVE" || loan.status === "OVERDUE";
  const overdueMs = now.getTime() - loan.dueDate.getTime();
  const daysOverdue = open && overdueMs > 0 ? Math.ceil(overdueMs / MS_PER_DAY) : 0;
  const currentFine = loan.status === "RETURNED" ? Number(loan.fineAmount.toString()) : calculateFineCents(loan.dueDate, now) / 100;

  return {
    id: loan.id,
    status: loan.status,
    borrowedAt: loan.borrowedAt,
    dueDate: loan.dueDate,
    returnedAt: loan.returnedAt,
    fineAmount: Number(loan.fineAmount.toString()),
    finePaid: loan.finePaid,
    daysOverdue,
    currentFine,
    user: loan.user,
    item: loan.item,
  };
}
