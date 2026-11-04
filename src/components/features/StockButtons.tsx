"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function StockButtons({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function adjust(action: "ADDED_COPIES" | "LOST" | "DAMAGED") {
    setPending(action);
    setError(null);
    const response = await fetch("/api/items/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, action, quantity: 1 }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(null);
    if (!response.ok) {
      setError(data.error ?? "Could not adjust stock.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending !== null} onClick={() => adjust("ADDED_COPIES")}>
          {pending === "ADDED_COPIES" ? "Adding…" : "Add copy"}
        </Button>
        <Button type="button" variant="outline" disabled={pending !== null} onClick={() => adjust("LOST")}>
          {pending === "LOST" ? "Saving…" : "Lost"}
        </Button>
        <Button type="button" variant="outline" disabled={pending !== null} onClick={() => adjust("DAMAGED")}>
          {pending === "DAMAGED" ? "Saving…" : "Damaged"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
