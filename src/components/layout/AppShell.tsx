"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BookOpen, LayoutDashboard, Library, Menu, X } from "lucide-react";

import { UserMenu } from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const memberLinks = [
  { href: "/catalogue", label: "Catalogue", icon: Library },
  { href: "/my-loans", label: "My Loans", icon: BookOpen },
];

const librarianLinks = [
  { href: "/librarian/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/librarian/items", label: "Items", icon: Library },
  { href: "/librarian/loans", label: "Loans", icon: BookOpen },
  { href: "/librarian/overdue", label: "Overdue", icon: AlertTriangle },
];

function pageName(pathname: string) {
  if (pathname.startsWith("/items/")) {
    return "Book";
  }
  const links = [...memberLinks, ...librarianLinks];
  return links.find((link) => link.href === pathname)?.label ?? "Library";
}

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = user.role === "LIBRARIAN" ? librarianLinks : memberLinks;
  const home = user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/catalogue";

  const rail = (
    <div className="flex h-full flex-col">
      <Link href={home} className="flex items-center gap-3 px-3 py-1" onClick={() => setOpen(false)}>
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
          <BookOpen className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900">Library</span>
          <span className="block text-xs text-slate-500">{user.role === "LIBRARIAN" ? "Librarian desk" : "Member shelf"}</span>
        </span>
      </Link>
      <nav className="mt-6 grid gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-[#eef2ff] hover:text-indigo-600",
                active && "bg-[#eef2ff] text-indigo-600",
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-slate-200 pt-4">
        <UserMenu user={user} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-slate-200 bg-white p-4 lg:block">{rail}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-white p-4 shadow-md">{rail}</aside>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <p className="text-sm font-semibold text-slate-900">{pageName(pathname)}</p>
        </header>
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
