import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/features/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <LoginScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginScreen({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const next = callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register";

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your library email and password.</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href={next} className="text-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
