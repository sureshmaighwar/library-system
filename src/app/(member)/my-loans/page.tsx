import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";

import { LoanCard } from "@/components/features/LoanCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { calculateFineCents } from "@/lib/fines";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Loans" };

export default function MyLoansPage() {
  return (
    <Suspense fallback={<LoansSkeleton />}>
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
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <BookOpen className="size-7 text-primary" />
        <h1 className="text-3xl font-semibold">My Loans</h1>
      </div>
      {loans.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
          <BookOpen className="size-12 text-indigo-300" />
          <p className="text-lg font-medium">You haven&apos;t borrowed any books yet</p>
          <Link href="/catalogue" className={cn(buttonVariants())}>
            Browse the catalogue
          </Link>
        </div>
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
              <p className="text-sm text-muted-foreground">No books are out right now.</p>
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
              <p className="text-sm text-muted-foreground">No returned loans yet.</p>
            ) : (
              history.map((loan) => <LoanCard key={loan.id} loan={loan} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function LoansSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-white" />
      <div className="h-36 animate-pulse rounded-2xl bg-white" />
      <div className="h-36 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
