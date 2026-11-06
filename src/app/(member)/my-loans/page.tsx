import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/features/EmptyState";
import { LoanCard } from "@/components/features/LoanCard";
import { ListSkeleton } from "@/components/features/LoadingSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { calculateFineCents } from "@/lib/fines";

export const metadata: Metadata = { title: "My Loans" };

export default function MyLoansPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <MyLoans />
    </Suspense>
  );
}

async function MyLoans() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { prisma } = await import("@/lib/prisma");
  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: {
      item: { select: { id: true, title: true, author: true } },
    },
    orderBy: { borrowedAt: "desc" },
  });
  const now = new Date();
  const active = loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "OVERDUE");
  const history = loans.filter((loan) => loan.status === "RETURNED");
  const itemIds = active.map((loan) => loan.itemId);
  const reservations =
    itemIds.length === 0
      ? []
      : await prisma.reservation.findMany({
          where: {
            itemId: { in: itemIds },
            fulfilledAt: null,
            userId: { not: session.user.id },
          },
          select: { itemId: true },
        });
  const reservedItems = new Set(reservations.map((reservation) => reservation.itemId));

  return (
    <div className="grid gap-4">
      {loans.length === 0 ? (
        <EmptyState
          variant="no-loans"
          title="You haven't borrowed any books yet"
          href="/catalogue"
          actionLabel="Browse the catalogue"
        />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="rounded-xl">
            <TabsTrigger value="active" className="rounded-lg px-4">
              Active Loans
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-4">
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4 grid gap-4">
            {active.length === 0 ? (
              <EmptyState variant="no-loans" title="No books are out right now." description="Returned books stay in History." />
            ) : (
              active.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  canRenew
                  hasReservation={reservedItems.has(loan.itemId)}
                  estimatedFineCents={calculateFineCents(loan.dueDate, now)}
                />
              ))
            )}
          </TabsContent>
          <TabsContent value="history" className="mt-4 grid gap-4">
            {history.length === 0 ? (
              <EmptyState variant="no-loans" title="No returned loans yet." description="Books you bring back will be listed here." />
            ) : (
              history.map((loan) => <LoanCard key={loan.id} loan={loan} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

