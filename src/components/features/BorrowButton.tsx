"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/providers/ToastProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BorrowButton({
  itemId,
  signedIn,
  disabled,
  reason,
}: {
  itemId: string;
  signedIn: boolean;
  disabled?: boolean;
  reason?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const callback = `/items/${itemId}`;

  async function onBorrow() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      const message = data.error ?? "Could not borrow this item.";
      setError(message);
      notify("error", "Could not borrow", message);
      setPending(false);
      return;
    }
    notify("success", "Book borrowed", "It is now on My Loans.");
    router.push("/my-loans");
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
      <Button type="button" onClick={onBorrow} disabled={disabled || pending}>
        {pending ? "Borrowing…" : "Borrow"}
      </Button>
      {reason ? <p className="text-sm text-muted-foreground">{reason}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
