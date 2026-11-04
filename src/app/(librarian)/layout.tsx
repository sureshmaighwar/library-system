import { connection } from "next/server";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/features/ErrorBoundary";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
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
    <div className="min-h-full">
      <Navbar user={user} />
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-6">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
