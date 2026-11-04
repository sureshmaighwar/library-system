import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoanCard } from "@/components/features/LoanCard";
import { auth } from "@/lib/auth";
import { calculateFineCents } from "@/lib/fines";
import { markOverdueLoans } from "@/lib/loans";

export const metadata: Metadata = { title: "My loans" };

export default function MyLoansPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading loans…</p>}>
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
  await markOverdueLoans(prisma);
  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: {
      item: { select: { id: true, title: true, author: true } },
    },
    orderBy: { borrowedAt: "desc" },
  });
  const now = new Date();

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">My loans</h1>
        <p className="text-sm text-muted-foreground">You can keep up to three items at a time. Each loan can be renewed once before it is overdue.</p>
      </div>
      {loans.length === 0 ? (
        <p className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-sm">
          You have not borrowed anything yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              canReturn
              canRenew
              estimatedFineCents={
                loan.status === "RETURNED" ? undefined : calculateFineCents(loan.dueDate, now)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
