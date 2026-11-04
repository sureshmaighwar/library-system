"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BookOpen, LayoutDashboard, Library } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/librarian/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/librarian/items", label: "Items", icon: Library },
  { href: "/librarian/loans", label: "Loans", icon: BookOpen },
  { href: "/librarian/overdue", label: "Overdue", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0">
      <nav className="grid gap-1 rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-sm">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active && "bg-accent text-accent-foreground",
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
