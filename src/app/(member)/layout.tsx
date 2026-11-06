import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ErrorBoundary } from "@/components/features/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth-utils";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <MemberShell>{children}</MemberShell>
    </Suspense>
  );
}

async function MemberShell({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell user={user}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
