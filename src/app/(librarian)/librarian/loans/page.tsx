import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/features/EmptyState";
import { TableSkeleton } from "@/components/features/LoadingSkeleton";
import { PayFineButton } from "@/components/features/PayFineButton";
import { ReturnConfirmDialog } from "@/components/features/ReturnConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFineAmount } from "@/lib/fines";
import { listLibrarianLoans, type LoanListStatus } from "@/lib/librarian-loans";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Loans" };

const TABS: Array<{ status: LoanListStatus; label: string }> = [
  { status: "all", label: "All" },
  { status: "active", label: "Active" },
  { status: "returned", label: "Returned" },
  { status: "overdue", label: "Overdue" },
];

type SearchParams = {
  status?: string;
  search?: string;
};

export default function LibrarianLoansPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <LoansDesk searchParams={searchParams} />
    </Suspense>
  );
}

async function LoansDesk({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const filters = parseFilters(await searchParams);
  const loans = await listLibrarianLoans(filters);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="text-sm text-muted-foreground">Every borrow and return, newest first.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={loansHref(filters, { status: tab.status })}
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              filters.status === tab.status
                ? "bg-primary text-primary-foreground"
                : "border border-[#e5e7eb] bg-white text-muted-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form action="/librarian/loans" className="flex flex-wrap items-center gap-2">
        {filters.status !== "all" ? <input type="hidden" name="status" value={filters.status} /> : null}
        <input
          name="search"
          defaultValue={filters.search}
          placeholder="Search member or title"
          className="h-10 min-w-56 flex-1 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm outline-none focus-visible:border-primary"
        />
        <Button type="submit" variant="outline" className="rounded-xl">
          Search
        </Button>
      </form>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        {loans.length === 0 ? (
          <EmptyState variant="no-results" href="/librarian/loans" actionLabel="Show all loans" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Borrowed</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => {
                const open = loan.status === "ACTIVE" || loan.status === "OVERDUE";
                const overdue = loan.status === "OVERDUE" || loan.daysOverdue > 0;
                return (
                  <TableRow key={loan.id} className={overdue ? "bg-red-50/60" : undefined}>
                    <TableCell>
                      <div className="grid">
                        <span>{loan.user.name}</span>
                        <span className="text-xs text-muted-foreground">{loan.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{loan.item.title}</TableCell>
                    <TableCell>{formatDate(loan.borrowedAt)}</TableCell>
                    <TableCell className={overdue ? "text-red-600" : undefined}>{formatDate(loan.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={overdue ? "destructive" : loan.status === "ACTIVE" ? "default" : "secondary"}>
                        {loan.status === "OVERDUE" ? "Overdue" : loan.status === "ACTIVE" ? "Active" : "Returned"}
                      </Badge>
                    </TableCell>
                    <TableCell className={overdue ? "font-medium text-red-600" : undefined}>
                      {formatFineAmount(loan.currentFine)}
                    </TableCell>
                    <TableCell>
                      {open ? (
                        <ReturnConfirmDialog
                          loanId={loan.id}
                          itemTitle={loan.item.title}
                          memberName={loan.user.name}
                          dueDate={loan.dueDate.toISOString()}
                          overdue={overdue}
                          fineLabel={formatFineAmount(loan.currentFine)}
                        />
                      ) : null}
                      {loan.status === "RETURNED" && !loan.finePaid && loan.fineAmount > 0 ? (
                        <PayFineButton loanId={loan.id} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function parseFilters(params: SearchParams): { status: LoanListStatus; search: string } {
  const status = params.status;
  const allowed: LoanListStatus[] = ["all", "active", "returned", "overdue"];
  return {
    status: allowed.includes(status as LoanListStatus) ? (status as LoanListStatus) : "all",
    search: params.search?.trim() ?? "",
  };
}

function loansHref(filters: { status: LoanListStatus; search: string }, overrides: Partial<{ status: LoanListStatus; search: string }>) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (next.status !== "all") {
    params.set("status", next.status);
  }
  if (next.search) {
    params.set("search", next.search);
  }
  const query = params.toString();
  return query ? `/librarian/loans?${query}` : "/librarian/loans";
}
