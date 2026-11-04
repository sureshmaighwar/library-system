import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/features/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">Members can borrow up to three items at a time.</p>
      </div>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
