"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function BorrowButton({
  itemId,
  disabled,
  reason,
}: {
  itemId: string;
  disabled?: boolean;
  reason?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      setError(data.error ?? "Could not borrow this item.");
      setPending(false);
      return;
    }
    router.push("/my-loans");
    router.refresh();
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
