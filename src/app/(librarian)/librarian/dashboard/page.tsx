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
    className: "from-indigo-500 to-indigo-400",
  },
  {
    key: "copiesOnLoan",
    label: "Copies on Loan",
    href: "/librarian/loans",
    icon: BookOpen,
    className: "from-blue-500 to-sky-400",
  },
  {
    key: "overdueLoans",
    label: "Overdue Loans",
    href: "/librarian/overdue",
    icon: AlertTriangle,
    className: "from-red-500 to-rose-400",
  },
  {
    key: "lowStockItems",
    label: "Low Stock Items",
    href: "#low-stock",
    icon: TrendingDown,
    className: "from-amber-500 to-orange-400",
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
      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome back, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{today}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const value = stat.key === "lowStockItems" ? dashboard.lowStockItems.length : dashboard[stat.key];
          return (
            <Link
              key={stat.key}
              href={stat.href}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards rounded-2xl bg-gradient-to-br p-6 text-white shadow-sm transition duration-200 hover:-translate-y-0.5",
                stat.className,
              )}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-sm text-white/90">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold">{value}</p>
            </Link>
          );
        })}
      </div>

      <section id="low-stock" className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
        {dashboard.lowStockItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Every title is above its stock threshold.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {dashboard.lowStockItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] p-4">
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

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
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
      </section>
    </div>
  );
}

function ActivityFeed({ activity }: { activity: LibrarianDashboard["recentActivity"] }) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      {activity.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No borrows or returns yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {activity.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] pb-3 last:border-0 last:pb-0">
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
