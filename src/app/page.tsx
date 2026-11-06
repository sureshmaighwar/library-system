import { connection } from "next/server";
import { Suspense } from "react";

import { ItemCard } from "@/components/features/ItemCard";
import { CardSkeleton } from "@/components/features/LoadingSkeleton";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { auth } from "@/lib/auth";
import { listCatalogue } from "@/lib/items";

export default function HomePage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <HomeShelf />
    </Suspense>
  );
}

async function HomeShelf() {
  await connection();
  const session = await auth();
  const { items, total } = await listCatalogue({
    search: "",
    category: "",
    available: false,
    page: 1,
    limit: 24,
  });

  return (
    <div className="min-h-screen">
      <PublicHeader user={session?.user ?? null} />
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">The shelf</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? "book" : "books"}. Open one to borrow it.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
