import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { BorrowButton } from "@/components/features/BorrowButton";
import { ReserveButton } from "@/components/features/ReserveButton";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { MAX_ACTIVE_LOANS, OPEN_LOAN_STATUSES } from "@/lib/loans";
import { getItem } from "@/lib/items";

export const metadata: Metadata = { title: "Item" };

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading item…</p>}>
      <ItemDetail params={params} />
    </Suspense>
  );
}

async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [session, item] = await Promise.all([auth(), getItem(id)]);
  if (!session?.user) {
    redirect("/login");
  }
  if (!item) {
    notFound();
  }

  const { prisma } = await import("@/lib/prisma");
  const [activeCount, existingLoan, reservation] = await Promise.all([
    prisma.loan.count({
      where: { userId: session.user.id, status: { in: [...OPEN_LOAN_STATUSES] } },
    }),
    prisma.loan.findFirst({
      where: {
        userId: session.user.id,
        itemId: item.id,
        status: { in: [...OPEN_LOAN_STATUSES] },
      },
      select: { id: true },
    }),
    prisma.reservation.findFirst({
      where: { userId: session.user.id, itemId: item.id, fulfilledAt: null },
      select: { id: true, position: true },
    }),
  ]);

  let reason: string | null = null;
  if (item.availableCopies === 0) {
    reason = reservation
      ? `You are number ${reservation.position} in the queue.`
      : "No copies are available right now.";
  } else if (existingLoan) {
    reason = "You already have this item on loan.";
  } else if (activeCount >= MAX_ACTIVE_LOANS) {
    reason = "You already have 3 active loans.";
  }

  const low = item.availableCopies > 0 && item.availableCopies <= item.lowStockThreshold;

  return (
    <article className="grid max-w-2xl gap-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">{item.category}</p>
          <h1 className="text-3xl font-semibold">{item.title}</h1>
          <p className="text-muted-foreground">{item.author}</p>
        </div>
        <Badge variant={item.availableCopies > 0 ? "secondary" : "destructive"} className={low ? "bg-amber-100 text-amber-800" : undefined}>
          {item.availableCopies} of {item.totalCopies} available
        </Badge>
      </div>
      <p className="text-sm">ISBN {item.isbn}</p>
      <p className="text-sm leading-6">{item.description || "No description yet."}</p>
      {item.availableCopies === 0 && !reservation ? <ReserveButton itemId={item.id} /> : null}
      <BorrowButton itemId={item.id} disabled={Boolean(reason)} reason={reason} />
    </article>
  );
}
