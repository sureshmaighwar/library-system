import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, BookOpen, Library, Plus, TrendingDown } from "lucide-react";

import { ListSkeleton } from "@/components/features/LoadingSkeleton";
import { RestockButton } from "@/components/features/RestockButton";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import type { LibrarianDashboard } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const stats = [
  {
    key: "totalItems",
    label: "Total Items",
    href: "/librarian/items",
    icon: Library,
    iconClass: "bg-[#eef2ff] text-indigo-600",
  },
  {
    key: "copiesOnLoan",
    label: "Copies on Loan",
    href: "/librarian/loans",
    icon: BookOpen,
    iconClass: "bg-sky-50 text-sky-600",
  },
  {
    key: "overdueLoans",
    label: "Overdue Loans",
    href: "/librarian/overdue",
    icon: AlertTriangle,
    iconClass: "bg-red-50 text-red-600",
  },
  {
    key: "lowStockItems",
    label: "Low Stock Items",
    href: "#low-stock",
    icon: TrendingDown,
    iconClass: "bg-amber-50 text-amber-600",
  },
] as const;

export default function DashboardPage() {
  return (
    <Suspense fallback={<ListSkeleton count={4} />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await connection();
  const user = await getCurrentUser();
  const { getLibrarianDashboard } = await import("@/lib/dashboard");
  const dashboard = await getLibrarianDashboard();
  const name = user?.name?.trim() || "Librarian";
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date());

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {name}</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/librarian/items" className={cn(buttonVariants(), "rounded-xl")}>
            <Plus className="size-4" />
            Add Item
          </Link>
          <Link href="/librarian/loans" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            View All Loans
          </Link>
          <Link href="/librarian/overdue" className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
            Check Overdue
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = stat.key === "lowStockItems" ? dashboard.lowStockItems.length : dashboard[stat.key];
          return (
            <Link
              key={stat.key}
              href={stat.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={cn("flex size-10 items-center justify-center rounded-xl", stat.iconClass)}>
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
      <section id="low-stock" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
        {dashboard.lowStockItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Every title is above its stock threshold.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {dashboard.lowStockItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.availableCopies}/{item.totalCopies} available
                  </p>
                </div>
                <RestockButton itemId={item.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityFeed activity={dashboard.recentActivity} />
      </div>
    </div>
  );
}

function ActivityFeed({ activity }: { activity: LibrarianDashboard["recentActivity"] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      {activity.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No borrows or returns yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {activity.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
              <p className="text-sm">
                <span className="font-medium">{event.memberName}</span>{" "}
                {event.type === "BORROW" ? "borrowed" : "returned"}{" "}
                <span className="font-medium">{event.itemTitle}</span>
              </p>
              <time className="shrink-0 text-sm text-muted-foreground" dateTime={event.at}>
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.at))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
