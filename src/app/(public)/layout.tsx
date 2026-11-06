import { connection } from "next/server";
import { Suspense } from "react";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { auth } from "@/lib/auth";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}>
      <PublicShell>{children}</PublicShell>
    </Suspense>
  );
}

async function PublicShell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();

  return (
    <div className="min-h-screen">
      <PublicHeader user={session?.user ?? null} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
