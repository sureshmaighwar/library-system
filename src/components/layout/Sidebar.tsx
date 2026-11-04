"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BookOpen, LayoutDashboard, Library, Menu } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/librarian/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/librarian/items", label: "Items", icon: Library },
  { href: "/librarian/loans", label: "Loans", icon: BookOpen },
  { href: "/librarian/overdue", label: "Overdue", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="w-full shrink-0 md:w-56">
      <button
        type="button"
        className="mb-2 inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm transition hover:-translate-y-px md:hidden"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Menu className="size-4" />
        {open ? "Hide menu" : "Menu"}
      </button>
      <nav className={cn("grid gap-1 rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-sm", open ? "grid" : "hidden md:grid")}>
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
