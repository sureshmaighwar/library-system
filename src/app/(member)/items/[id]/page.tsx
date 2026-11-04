import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { BorrowButton } from "@/components/features/BorrowButton";
import { copyLabel, ItemCover } from "@/components/features/ItemCard";
import { ReserveButton } from "@/components/features/ReserveButton";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getItem } from "@/lib/items";
import { MAX_ACTIVE_LOANS, OPEN_LOAN_STATUSES } from "@/lib/loans";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Item" };

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ItemSkeleton />}>
      <ItemDetail params={params} />
    </Suspense>
  );
}

function availabilityClass(availableCopies: number) {
  if (availableCopies <= 0) {
    return "bg-red-50 text-red-600";
  }
  if (availableCopies <= 2) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-emerald-50 text-emerald-700";
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
      select: { status: true, dueDate: true },
    }),
    prisma.reservation.findFirst({
      where: { userId: session.user.id, itemId: item.id, fulfilledAt: null },
      select: { position: true },
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

  return (
    <article className="grid gap-6 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm md:grid-cols-[280px_1fr]">
      <div className="h-80 overflow-hidden rounded-2xl">
        <ItemCover src={item.coverImage} title={item.title} />
      </div>
      <div className="grid content-start gap-4">
        <Badge variant="secondary" className="w-fit">
          {item.category}
        </Badge>
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold">{item.title}</h1>
          <p className="text-muted-foreground">{item.author}</p>
        </div>
        <p className={cn("w-fit rounded-full px-3 py-1 text-sm font-medium", availabilityClass(item.availableCopies))}>
          {copyLabel(item.availableCopies, item.totalCopies)}
        </p>
        <p className="text-sm">ISBN {item.isbn}</p>
        <p className="text-sm leading-6">{item.description || "No description yet."}</p>
        {existingLoan ? (
          <p className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            {`You have this book out. Status: ${existingLoan.status === "OVERDUE" ? "Overdue" : "Active"}. Due ${formatDate(existingLoan.dueDate)}.`}
          </p>
        ) : null}
        {item.availableCopies === 0 && !reservation ? <ReserveButton itemId={item.id} /> : null}
        <BorrowButton itemId={item.id} disabled={Boolean(reason)} reason={reason} />
      </div>
    </article>
  );
}

function ItemSkeleton() {
  return (
    <div className="grid gap-6 rounded-2xl bg-white p-6 md:grid-cols-[280px_1fr]">
      <div className="h-80 animate-pulse rounded-2xl bg-indigo-50" />
      <div className="grid content-start gap-3">
        <div className="h-6 w-24 animate-pulse rounded-full bg-indigo-50" />
        <div className="h-8 w-2/3 animate-pulse rounded-xl bg-indigo-50" />
        <div className="h-4 w-1/3 animate-pulse rounded-xl bg-indigo-50" />
        <div className="h-20 animate-pulse rounded-xl bg-indigo-50" />
      </div>
    </div>
  );
}
