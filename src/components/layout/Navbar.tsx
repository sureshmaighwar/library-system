import Link from "next/link";
import { BookOpen } from "lucide-react";

import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types";

export function Navbar({ user }: { user: SessionUser }) {
  const links =
    user.role === "LIBRARIAN"
      ? [
          { href: "/librarian/dashboard", label: "Desk" },
          { href: "/catalogue", label: "Catalogue" },
        ]
      : [
          { href: "/catalogue", label: "Catalogue" },
          { href: "/my-loans", label: "My loans" },
        ];

  return (
    <header className="border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/catalogue"} className="flex items-center gap-2 font-semibold text-foreground">
          <BookOpen className="size-5 text-primary" />
          Library
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
