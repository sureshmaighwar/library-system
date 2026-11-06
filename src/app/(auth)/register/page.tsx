import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "@/components/features/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <RegisterScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterScreen({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const next = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">Members can borrow up to three items at a time.</p>
      </div>
      <RegisterForm callbackUrl={callbackUrl} />
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href={next} className="text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
