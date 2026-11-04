"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/lib/actions";
import type { SessionUser } from "@/types";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const initial = (user.name ?? user.email ?? "U").trim().charAt(0).toUpperCase();
  const roleLabel = user.role === "LIBRARIAN" ? "Librarian" : "Member";

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-2 py-1.5 text-sm transition hover:-translate-y-px"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Badge className="mt-2" variant="secondary">
            {roleLabel}
          </Badge>
          <form action={signOutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm transition hover:bg-muted"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
