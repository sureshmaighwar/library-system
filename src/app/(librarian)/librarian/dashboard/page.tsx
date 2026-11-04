import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { markOverdueLoans } from "@/lib/loans";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading dashboard…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await connection();
  const { prisma } = await import("@/lib/prisma");
  const now = new Date();
  await markOverdueLoans(prisma, now);
  const [items, openLoans, overdue, members] = await Promise.all([
    prisma.item.count(),
    prisma.loan.count({ where: { status: { in: ["ACTIVE", "OVERDUE"] } } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
  ]);

  const stats = [
    { label: "Items", value: items, href: "/librarian/items" },
    { label: "Open loans", value: openLoans, href: "/librarian/loans" },
    { label: "Overdue", value: overdue, href: "/librarian/overdue" },
    { label: "Members", value: members, href: "/librarian/loans" },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Today&apos;s shelf, loans, and overdue items.</p>
        </div>
        <Link href="/librarian/items" className={cn(buttonVariants())}>
          Add an item
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm ring-0">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
