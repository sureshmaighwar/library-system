import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { LoanCard } from "@/components/features/LoanCard";
import { calculateFineCents } from "@/lib/fines";
import { markOverdueLoans } from "@/lib/loans";

export const metadata: Metadata = { title: "Overdue" };

export default function OverduePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading overdue loans…</p>}>
      <OverdueDesk />
    </Suspense>
  );
}

async function OverdueDesk() {
  await connection();
  const { prisma } = await import("@/lib/prisma");
  const now = new Date();
  await markOverdueLoans(prisma, now);
  const loans = await prisma.loan.findMany({
    where: { status: "OVERDUE" },
    include: {
      item: { select: { id: true, title: true, author: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Overdue</h1>
        <p className="text-sm text-muted-foreground">
          Active loans past their due date. The fine shown is $0.50 per day and is saved when the item is returned.
        </p>
      </div>
      {loans.length === 0 ? (
        <p className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-sm">
          Nothing is overdue.
        </p>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              canReturn
              estimatedFineCents={calculateFineCents(loan.dueDate, now)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
