import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/features/EmptyState";
import { ItemCard } from "@/components/features/ItemCard";
import { CardSkeleton } from "@/components/features/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { listCatalogue, listCategories } from "@/lib/items";
import { catalogueQuerySchema, type CatalogueQuery } from "@/lib/validations";

export const metadata: Metadata = { title: "Catalogue" };

type SearchParams = {
  search?: string;
  category?: string;
  available?: string;
  page?: string;
  limit?: string;
};

export default function CataloguePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <CatalogueResults searchParams={searchParams} />
    </Suspense>
  );
}

function parseFilters(params: SearchParams): CatalogueQuery {
  const parsed = catalogueQuerySchema.safeParse({
    search: params.search ?? "",
    category: params.category ?? "",
    available: params.available ?? "",
    page: params.page ?? "1",
    limit: params.limit ?? "8",
  });
  if (parsed.success) {
    return parsed.data;
  }
  return { search: "", category: "", available: false, page: 1, limit: 8 };
}

function catalogueHref(filters: CatalogueQuery, overrides: Partial<CatalogueQuery> = {}) {
  const next = { ...filters, page: 1, ...overrides };
  const params = new URLSearchParams();
  if (next.search) {
    params.set("search", next.search);
  }
  if (next.category) {
    params.set("category", next.category);
  }
  if (next.available) {
    params.set("available", "true");
  }
  if (next.page > 1) {
    params.set("page", String(next.page));
  }
  const query = params.toString();
  return query ? `/catalogue?${query}` : "/catalogue";
}

async function CatalogueResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseFilters(await searchParams);
  const [{ items, total, page, limit }, categories] = await Promise.all([
    listCatalogue(filters),
    listCategories(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form action="/catalogue" className="grid gap-3">
          {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                name="search"
                defaultValue={filters.search}
                placeholder="Title or author"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-9 text-sm font-normal outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="available" value="true" defaultChecked={filters.available} />
            Available only
          </label>
          <Button type="submit">Apply</Button>
        </form>
        <div className="mt-5 grid gap-1">
          <p className="px-3 pb-1 text-xs font-medium tracking-wide text-slate-400 uppercase">Category</p>
          <FilterChip href={catalogueHref(filters, { category: "" })} active={!filters.category}>
            All
          </FilterChip>
          {categories.map((category) => (
            <FilterChip key={category} href={catalogueHref(filters, { category })} active={filters.category === category}>
              {category}
            </FilterChip>
          ))}
        </div>
      </aside>

      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Catalogue</h1>
            <p className="text-sm text-slate-500">
              {total} {total === 1 ? "book" : "books"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {page > 1 ? (
              <Link href={catalogueHref(filters, { page: page - 1 })} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                Previous
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-200 px-3 py-2 text-slate-400">Previous</span>
            )}
            <span className="text-slate-500">
              {page} / {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={catalogueHref(filters, { page: page + 1 })} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                Next
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-200 px-3 py-2 text-slate-400">Next</span>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            variant="no-results"
            title="No books match those filters."
            description="Try another title, or clear the filters."
            href="/catalogue"
            actionLabel="Back to the full catalogue"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-xl bg-[#eef2ff] px-3 py-2 text-sm font-medium text-indigo-600"
          : "rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
      }
    >
      {children}
    </Link>
  );
}

