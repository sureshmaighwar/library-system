"use client";

import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/actions";
import type { SessionUser } from "@/types";

export function UserMenu({ user }: { user: SessionUser }) {
  const initial = (user.name ?? user.email ?? "U").trim().charAt(0).toUpperCase();
  const roleLabel = user.role === "LIBRARIAN" ? "Librarian" : "Member";

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
          {initial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-900">{user.name}</span>
          <span className="block truncate text-xs text-slate-500">{roleLabel}</span>
        </span>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-[#eef2ff] hover:text-indigo-600"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}
