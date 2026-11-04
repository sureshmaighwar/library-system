import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { auth } from "@/lib/auth";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <MemberShell>{children}</MemberShell>
    </Suspense>
  );
}

async function MemberShell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-full">
      <Navbar user={session.user} />
      <div className="mx-auto w-full max-w-6xl p-6">{children}</div>
    </div>
  );
}
