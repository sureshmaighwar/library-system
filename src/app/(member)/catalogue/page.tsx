import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { ItemCard } from "@/components/features/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listItems } from "@/lib/items";

export const metadata: Metadata = { title: "Catalogue" };

export default function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading catalogue…</p>}>
      <CatalogueResults searchParams={searchParams} />
    </Suspense>
  );
}

async function CatalogueResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q } = await searchParams;
  const items = await listItems(q);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Catalogue</h1>
        <p className="text-sm text-muted-foreground">Search by title, author, or ISBN.</p>
      </div>
      <form action="/catalogue" className="flex gap-2">
        <Input name="q" defaultValue={q ?? ""} placeholder="Search the shelves" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-muted-foreground shadow-sm">
          No items match that search.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
