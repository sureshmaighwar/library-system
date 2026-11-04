import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookOpen, Search } from "lucide-react";

import { ItemCard } from "@/components/features/ItemCard";
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
    <Suspense fallback={<CatalogueSkeleton />}>
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
    <div className="grid gap-6">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-100 via-white to-indigo-50 px-6 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Discover Your Next Read</h1>
        <p className="mt-2 text-sm text-muted-foreground">Search by title or author, then filter the shelves.</p>
        <form action="/catalogue" className="relative mx-auto mt-6 max-w-xl">
          {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={filters.search}
            placeholder="Search title or author"
            className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white pr-4 pl-11 text-sm shadow-sm outline-none focus-visible:border-primary"
          />
        </form>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href={catalogueHref(filters, { category: "" })} active={!filters.category}>
          All
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category}
            href={catalogueHref(filters, { category })}
            active={filters.category === category}
          >
            {category}
          </FilterChip>
        ))}
      </div>

      <form action="/catalogue" className="flex items-center gap-2 text-sm">
        {filters.search ? <input type="hidden" name="search" value={filters.search} /> : null}
        {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
        <label className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
          <input type="checkbox" name="available" value="true" defaultChecked={filters.available} />
          Show only available
        </label>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
          <BookOpen className="size-12 text-indigo-300" />
          <p className="text-lg font-medium">No books match those filters.</p>
          <p className="text-sm text-muted-foreground">Try another title, or clear the filters.</p>
          <Link href="/catalogue" className="text-sm font-medium text-primary">
            Back to the full catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          {total} {total === 1 ? "book" : "books"}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link href={catalogueHref(filters, { page: page - 1 })} className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
              Previous
            </Link>
          ) : (
            <span className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-muted-foreground">Previous</span>
          )}
          <span className="inline-flex items-center px-2">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={catalogueHref(filters, { page: page + 1 })} className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
              Next
            </Link>
          ) : (
            <span className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-muted-foreground">Next</span>
          )}
        </div>
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
          ? "rounded-full bg-primary px-3 py-1.5 text-sm text-white"
          : "rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-muted-foreground"
      }
    >
      {children}
    </Link>
  );
}

function CatalogueSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-40 animate-pulse rounded-2xl bg-indigo-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
