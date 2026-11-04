import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";

export default function LibrarianLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <LibrarianShell>{children}</LibrarianShell>
    </Suspense>
  );
}

async function LibrarianShell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "LIBRARIAN") {
    redirect("/catalogue");
  }

  return (
    <div className="min-h-full">
      <Navbar user={session.user} />
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-6">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
