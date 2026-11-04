"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";

export function RenewButton({ loanId, disabled = false }: { loanId: string; disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onRenew() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      const message = data.error ?? "Could not renew this loan.";
      setError(message);
      notify("error", "Could not renew", message);
      return;
    }
    notify("success", "Loan renewed", "The due date moved forward 14 days.");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={onRenew} disabled={disabled || pending}>
        {pending ? "Renewing…" : "Renew"}
      </Button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
