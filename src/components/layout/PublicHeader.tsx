import Link from "next/link";
import { BookOpen } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeaderUser = {
  name?: string | null;
  role?: string | null;
} | null;

export function PublicHeader({ user }: { user: HeaderUser }) {
  const librarian = user?.role === "LIBRARIAN";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-indigo-500 text-white">
            <BookOpen className="size-4" />
          </span>
          Library
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href={librarian ? "/librarian/dashboard" : "/my-loans"} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {librarian ? "Desk" : "My Loans"}
            </Link>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                Sign in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
