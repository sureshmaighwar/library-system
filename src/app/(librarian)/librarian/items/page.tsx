import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/features/EmptyState";
import { ItemActions } from "@/components/features/ItemActions";
import { TableSkeleton } from "@/components/features/LoadingSkeleton";
import { AddItemButton } from "@/components/features/ItemFormModal";
import { ItemCover } from "@/components/features/ItemCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listCategories, listLibrarianItems } from "@/lib/items";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Items" };

const PAGE_SIZE = 8;

type SearchParams = {
  search?: string;
  category?: string;
  page?: string;
};

type DeskFilters = {
  search: string;
  category: string;
  page: number;
  limit: number;
};

export default function LibrarianItemsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ItemsDesk searchParams={searchParams} />
    </Suspense>
  );
}

async function ItemsDesk({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseFilters(await searchParams);
  const [{ items, total, page, limit }, categories] = await Promise.all([
    listLibrarianItems(filters),
    listCategories(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">Items</h1>
          <p className="text-sm text-muted-foreground">Search the shelf, then add, edit, or restock a title.</p>
        </div>
        <AddItemButton categories={categories} />
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <form action="/librarian/items" className="flex flex-wrap items-center gap-2">
        <input
          name="search"
          defaultValue={filters.search}
          placeholder="Search title, author, or ISBN"
          className="h-10 min-w-56 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
        <select
          name="category"
          defaultValue={filters.category}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" className="rounded-xl">
          Search
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          variant="no-items"
          href="/librarian/items"
          actionLabel="Clear the search"
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="h-14 w-10 overflow-hidden rounded-lg">
                        <ItemCover src={item.coverImage} title={item.title} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="font-mono text-slate-500">{item.isbn}</TableCell>
                    <TableCell>
                      <StockCount available={item.availableCopies} total={item.totalCopies} threshold={item.lowStockThreshold} />
                    </TableCell>
                    <TableCell>
                      <ItemActions item={item} categories={categories} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {items.map((item) => (
              <article key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg">
                    <ItemCover src={item.coverImage} title={item.title} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-medium">{item.title}</h2>
                    <p className="text-sm text-muted-foreground">{item.author}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    <p className="font-mono text-sm text-slate-500">{item.isbn}</p>
                    <StockCount available={item.availableCopies} total={item.totalCopies} threshold={item.lowStockThreshold} />
                  </div>
                </div>
                <ItemActions item={item} categories={categories} />
              </article>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">{total} items</p>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={itemsHref(filters, page - 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              Previous
            </Link>
          ) : (
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-muted-foreground">Previous</span>
          )}
          <span>
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={itemsHref(filters, page + 1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              Next
            </Link>
          ) : (
            <span className="rounded-xl border border-slate-200 px-3 py-2 text-muted-foreground">Next</span>
          )}
        </div>
      </div>
      </section>
    </div>
  );
}

function StockCount({ available, total, threshold }: { available: number; total: number; threshold: number }) {
  const tone =
    available <= 0
      ? "bg-red-100 text-red-700"
      : available <= threshold
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-700";
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tone)}>{available}/{total}</span>;
}

function parseFilters(params: SearchParams): DeskFilters {
  const page = Number(params.page ?? "1");
  return {
    search: params.search?.trim() ?? "",
    category: params.category?.trim() ?? "",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: PAGE_SIZE,
  };
}

function itemsHref(filters: DeskFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `/librarian/items?${query}` : "/librarian/items";
}
