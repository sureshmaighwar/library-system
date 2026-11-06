import { connection } from "next/server";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/features/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth-utils";

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <LibrarianShell>{children}</LibrarianShell>
    </Suspense>
  );
}

async function LibrarianShell({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requireRole("LIBRARIAN");

  return (
    <AppShell user={user}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
