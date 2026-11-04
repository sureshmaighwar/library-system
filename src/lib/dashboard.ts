import { markOverdueLoans } from "@/lib/loans";
import { prisma } from "@/lib/prisma";

export type DashboardActivity = {
  id: string;
  type: "BORROW" | "RETURN";
  at: string;
  itemTitle: string;
  memberName: string;
};

export type LowStockItem = {
  id: string;
  title: string;
  availableCopies: number;
  totalCopies: number;
};

export type LibrarianDashboard = {
  totalItems: number;
  totalCopies: number;
  copiesOnLoan: number;
  activeLoans: number;
  overdueLoans: number;
  lowStockItems: LowStockItem[];
  totalFines: number;
  recentActivity: DashboardActivity[];
};

type ActivityLoan = {
  id: string;
  borrowedAt: Date;
  returnedAt: Date | null;
  item: { title: string };
  user: { name: string };
};

const activityInclude = {
  item: { select: { title: true } },
  user: { select: { name: true } },
} as const;

/**
 * Librarian desk totals. Late active loans are marked OVERDUE first so the
 * overdue count matches the overdue page. Copies on loan are the copies that
 * are no longer on the shelf. Unpaid fines are the amounts saved on return.
 */
export async function getLibrarianDashboard(now = new Date()): Promise<LibrarianDashboard> {
  await markOverdueLoans(prisma, now);

  const [totalItems, copySums, activeLoans, overdueLoans, lowStockRows, fineSum, borrows, returns] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.aggregate({ _sum: { totalCopies: true, availableCopies: true } }),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({
        where: {
          dueDate: { lt: now },
          status: { in: ["ACTIVE", "OVERDUE"] },
        },
      }),
      prisma.$queryRaw<Array<{ id: string; title: string; availableCopies: number; totalCopies: number }>>`
        SELECT "id", "title", "availableCopies", "totalCopies"
        FROM "items"
        WHERE "availableCopies" <= "lowStockThreshold"
        ORDER BY "availableCopies" ASC, "title" ASC
      `,
      prisma.loan.aggregate({
        where: { finePaid: false },
        _sum: { fineAmount: true },
      }),
      prisma.loan.findMany({
        orderBy: { borrowedAt: "desc" },
        take: 10,
        include: activityInclude,
      }),
      prisma.loan.findMany({
        where: { returnedAt: { not: null } },
        orderBy: { returnedAt: "desc" },
        take: 10,
        include: activityInclude,
      }),
    ]);

  const totalCopies = copySums._sum.totalCopies ?? 0;
  const availableCopies = copySums._sum.availableCopies ?? 0;

  return {
    totalItems,
    totalCopies,
    copiesOnLoan: totalCopies - availableCopies,
    activeLoans,
    overdueLoans,
    lowStockItems: lowStockRows.map((item) => ({
      id: item.id,
      title: item.title,
      availableCopies: Number(item.availableCopies),
      totalCopies: Number(item.totalCopies),
    })),
    totalFines: Number(fineSum._sum.fineAmount?.toString() ?? 0),
    recentActivity: latestActivity(borrows, returns),
  };
}

function latestActivity(borrows: ActivityLoan[], returns: ActivityLoan[]): DashboardActivity[] {
  const events: Array<DashboardActivity & { time: number }> = borrows.map((loan) => ({
    id: `${loan.id}-borrow`,
    type: "BORROW",
    at: loan.borrowedAt.toISOString(),
    time: loan.borrowedAt.getTime(),
    itemTitle: loan.item.title,
    memberName: loan.user.name,
  }));

  for (const loan of returns) {
    if (!loan.returnedAt) {
      continue;
    }
    events.push({
      id: `${loan.id}-return`,
      type: "RETURN",
      at: loan.returnedAt.toISOString(),
      time: loan.returnedAt.getTime(),
      itemTitle: loan.item.title,
      memberName: loan.user.name,
    });
  }

  events.sort((left, right) => right.time - left.time);
  return events.slice(0, 10).map((event) => ({
    id: event.id,
    type: event.type,
    at: event.at,
    itemTitle: event.itemTitle,
    memberName: event.memberName,
  }));
}
