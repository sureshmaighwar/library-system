import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading…</p>}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  await connection();
  const session = await auth();
  if (session?.user.role === "LIBRARIAN") {
    redirect("/librarian/dashboard");
  }
  if (session?.user) {
    redirect("/catalogue");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <BookOpen className="size-6 text-primary" />
      </div>
      <div className="grid gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">Find a book and take it home.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Browse the catalogue, borrow up to three items, and return them when you are done. Late returns are $0.50 a day.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
        <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
          Create account
        </Link>
      </div>
    </main>
  );
}
