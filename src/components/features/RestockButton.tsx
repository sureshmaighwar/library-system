"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";

export function RestockButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function restock() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/items/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, action: "ADDED_COPIES", quantity: 1 }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      const message = data.error ?? "Could not restock this item.";
      setError(message);
      notify("error", "Could not restock", message);
      return;
    }
    notify("success", "Copy added");
    router.refresh();
  }

  return (
    <div className="grid justify-items-end gap-1">
      <Button type="button" variant="outline" className="rounded-xl" disabled={pending} onClick={restock}>
        {pending ? "Restocking…" : "Restock"}
      </Button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
