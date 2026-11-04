"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { notify } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

export function ReturnConfirmDialog({
  loanId,
  itemTitle,
  memberName,
  dueDate,
  overdue,
  fineLabel,
}: {
  loanId: string;
  itemTitle: string;
  memberName: string;
  dueDate: string;
  overdue: boolean;
  fineLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function confirmReturn() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      const message = data.error ?? "Could not return this loan.";
      setError(message);
      notify("error", "Could not return", message);
      return;
    }
    notify("success", "Book returned", itemTitle);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setError(null); setOpen(true); }}>
        Return
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl bg-white p-6 text-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Return {itemTitle}?</DialogTitle>
            <DialogDescription>This puts one copy back on the shelf and saves the fine.</DialogDescription>
          </DialogHeader>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Member</dt>
              <dd className="font-medium">{memberName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Due</dt>
              <dd className="font-medium">{formatDate(new Date(dueDate))}</dd>
            </div>
            {overdue ? (
              <div className="flex justify-between gap-4">
                <dt className="text-red-600">Fine</dt>
                <dd className="font-medium text-red-600">{fineLabel}</dd>
              </div>
            ) : null}
          </dl>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={pending} onClick={confirmReturn}>
              {pending ? "Returning…" : "Confirm return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
