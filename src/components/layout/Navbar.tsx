import Link from "next/link";
import { BookOpen } from "lucide-react";

import { MobileNav } from "@/components/layout/MobileNav";
import { UserMenu } from "@/components/layout/UserMenu";
import type { SessionUser } from "@/types";

const memberLinks = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/my-loans", label: "My Loans" },
];

const librarianLinks = [
  { href: "/librarian/dashboard", label: "Dashboard" },
  { href: "/librarian/items", label: "Items" },
  { href: "/librarian/loans", label: "Loans" },
  { href: "/librarian/overdue", label: "Overdue" },
];

export function Navbar({ user }: { user: SessionUser }) {
  const links = user.role === "LIBRARIAN" ? librarianLinks : memberLinks;
  const home = user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/catalogue";

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MobileNav links={links} />
          <Link href={home} className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-5 text-primary" />
            Library System
          </Link>
        </div>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground transition hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
