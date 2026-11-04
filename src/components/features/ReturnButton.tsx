"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ReturnButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onReturn() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not return this loan.");
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={onReturn} disabled={pending}>
        {pending ? "Returning…" : "Return"}
      </Button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
