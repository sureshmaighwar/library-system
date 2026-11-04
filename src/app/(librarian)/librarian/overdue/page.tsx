import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/features/EmptyState";
import { ListSkeleton } from "@/components/features/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { formatFineAmount } from "@/lib/fines";
import { listOverdueLoans } from "@/lib/librarian-loans";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overdue" };

export default function OverduePage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <OverdueDesk />
    </Suspense>
  );
}

async function OverdueDesk() {
  await connection();
  const { loans, totalOverdue, totalFines } = await listOverdueLoans();

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Overdue</h1>
        <p className="text-sm text-muted-foreground">
          Loans past their due date. The fine is $0.50 per day and is saved when the item is returned.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total overdue</p>
          <p className="mt-1 text-3xl font-semibold text-red-600">{totalOverdue}</p>
        </section>
        <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total fines owed</p>
          <p className="mt-1 text-3xl font-semibold text-red-600">{formatFineAmount(totalFines)}</p>
        </section>
      </div>

      {loans.length === 0 ? (
        <EmptyState variant="no-loans" title="Nothing is overdue." description="Every open loan is still within its due date." />
      ) : (
        <div className="grid gap-3">
          {loans.map((loan) => (
            <article key={loan.id} className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-1">
                  <h2 className="text-lg font-semibold">{loan.item.title}</h2>
                  <p className="text-sm text-muted-foreground">{loan.item.author}</p>
                  <p className="text-sm">
                    <span className="font-medium">{loan.user.name}</span>
                    <span className="text-muted-foreground"> · {loan.user.email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Due {formatDate(loan.dueDate)}</p>
                </div>
                <div className="grid justify-items-end gap-1">
                  <p className="text-2xl font-semibold text-red-600">{loan.daysOverdue} days overdue</p>
                  <p className="font-medium text-red-600">{formatFineAmount(loan.currentFine)}</p>
                  <Button type="button" variant="outline" className="mt-2 rounded-xl">
                    Contact Member
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
