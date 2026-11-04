"use client";

import type { ReactNode } from "react";

import { Toaster, toast } from "@/components/ui/toast";

export type ToastKind = "success" | "error" | "info";

/** Show a toast that slides in and closes itself after 3 seconds. */
export function notify(type: ToastKind, title: string, description?: string) {
  toast.add({
    type,
    title,
    description,
    timeout: 3000,
  });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return <Toaster timeout={3000}>{children}</Toaster>;
}
