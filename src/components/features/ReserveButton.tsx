"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/providers/ToastProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReserveButton({ itemId, signedIn }: { itemId: string; signedIn: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const callback = `/items/${itemId}`;

  async function onReserve() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      const message = data.error ?? "Could not reserve this item.";
      setError(message);
      notify("error", "Could not reserve", message);
      return;
    }
    notify("success", "Joined the queue");
    router.refresh();
  }

  if (!signedIn) {
    return (
      <div className="grid gap-2">
        <Link href={`/login?callbackUrl=${encodeURIComponent(callback)}`} className={cn(buttonVariants())}>
          Sign in to borrow
        </Link>
        <Link href={`/register?callbackUrl=${encodeURIComponent(callback)}`} className={cn(buttonVariants({ variant: "outline" }))}>
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={onReserve} disabled={pending}>
        {pending ? "Reserving…" : "Join the queue"}
      </Button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
