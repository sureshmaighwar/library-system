import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BorrowButton } from "@/components/features/BorrowButton";
import { CardSkeleton } from "@/components/features/LoadingSkeleton";
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
    <Suspense fallback={<CardSkeleton count={1} />}>
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
  if (!item) {
    notFound();
  }

  const signedIn = Boolean(session?.user?.id);
  let reason: string | null = null;
  let existingLoan: { status: string; dueDate: Date } | null = null;
  let reservation: { position: number } | null = null;

  if (session?.user?.id) {
    const { prisma } = await import("@/lib/prisma");
    const [activeCount, openLoan, openReservation] = await Promise.all([
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
    existingLoan = openLoan;
    reservation = openReservation;
    if (item.availableCopies === 0) {
      reason = reservation
        ? `You are number ${reservation.position} in the queue.`
        : "No copies are available right now.";
    } else if (existingLoan) {
      reason = "You already have this item on loan.";
    } else if (activeCount >= MAX_ACTIVE_LOANS) {
      reason = "You already have 3 active loans.";
    }
  }

  return (
    <article className="grid items-start gap-6 lg:grid-cols-[280px_1fr_280px]">
      <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ItemCover src={item.coverImage} title={item.title} />
      </div>
      <div className="grid content-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge variant="secondary" className="w-fit">
          {item.category}
        </Badge>
        <div className="grid gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{item.title}</h1>
          <p className="text-slate-500">{item.author}</p>
        </div>
        <p className={cn("w-fit rounded-full px-3 py-1 text-sm font-medium", availabilityClass(item.availableCopies))}>
          {copyLabel(item.availableCopies, item.totalCopies)}
        </p>
        <p className="font-mono text-sm text-slate-500">ISBN {item.isbn}</p>
        <p className="text-sm leading-6 text-slate-700">{item.description || "No description yet."}</p>
        {existingLoan ? (
          <p className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            {`You have this book out. Status: ${existingLoan.status === "OVERDUE" ? "Overdue" : "Active"}. Due ${formatDate(existingLoan.dueDate)}.`}
          </p>
        ) : null}
      </div>
      <aside className="grid content-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
        <p className="text-sm font-semibold text-slate-900">Take this book</p>
        <p className="text-sm text-slate-500">Members can hold three open loans. A late book is $0.50 a day.</p>
        {item.availableCopies === 0 && (!signedIn || !reservation) ? <ReserveButton itemId={item.id} signedIn={signedIn} /> : null}
        {signedIn || item.availableCopies > 0 ? (
          <BorrowButton itemId={item.id} signedIn={signedIn} disabled={Boolean(reason)} reason={reason} />
        ) : null}
      </aside>
    </article>
  );
}
