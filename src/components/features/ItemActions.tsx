"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ItemFormModal, type EditableItem } from "@/components/features/ItemFormModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/providers/ToastProvider";

export function ItemActions({ item, categories }: { item: EditableItem; categories: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  async function removeItem() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      const message = data.error ?? "Could not delete that item.";
      setError(message);
      notify("error", "Could not delete", message);
      return;
    }
    notify("success", "Item deleted", item.title);
    setConfirming(false);
    router.refresh();
  }

  async function restockItem() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/items/${item.id}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, reason }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      const message = data.error ?? "Could not restock that item.";
      setError(message);
      notify("error", "Could not restock", message);
      return;
    }
    notify("success", "Copies added", item.title);
    setRestocking(false);
    setReason("");
    setQuantity(1);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(true)}>
        Edit
      </Button>
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setError(null); setConfirming(true); }}>
        Delete
      </Button>
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setError(null); setRestocking(true); }}>
        Restock
      </Button>

      {editing ? <ItemFormModal open={editing} onOpenChange={setEditing} categories={categories} item={item} /> : null}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="rounded-2xl bg-white p-6 text-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete {item.title}?</DialogTitle>
            <DialogDescription>This removes the title from the catalogue. An item that is still on loan stays.</DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={pending} onClick={removeItem}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restocking} onOpenChange={setRestocking}>
        <DialogContent className="rounded-2xl bg-white p-6 text-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Restock {item.title}</DialogTitle>
            <DialogDescription>Added copies go on the shelf and are written to the stock log.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`quantity-${item.id}`}>Copies</Label>
              <Input
                id={`quantity-${item.id}`}
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`reason-${item.id}`}>Reason</Label>
              <Input id={`reason-${item.id}`} value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" className="rounded-xl" disabled={pending} onClick={restockItem}>
              {pending ? "Saving…" : "Add copies"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
