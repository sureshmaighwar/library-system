import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/features/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your library email and password.</p>
      </div>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="text-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
