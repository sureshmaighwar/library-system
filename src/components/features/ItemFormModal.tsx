"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/providers/ToastProvider";
import { itemSchema, type ItemInput } from "@/lib/validations";

const NEW_CATEGORY = "__new";

export type EditableItem = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string | null;
  coverImage: string | null;
  totalCopies: number;
};

export function ItemFormModal({
  open,
  onOpenChange,
  categories,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  item?: EditableItem | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const form = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: item ? valuesFromItem(item) : emptyValues(categories),
  });
  const selectedCategory = form.watch("category");

  async function onSubmit(values: ItemInput) {
    setError(null);
    const category = values.category === NEW_CATEGORY ? newCategory.trim() : values.category;
    const payload = { ...values, category };
    const checked = itemSchema.safeParse(payload);
    if (!checked.success) {
      const message = checked.error.issues[0]?.message ?? "Check the item details and try again.";
      setError(message);
      notify("error", "Check the form", message);
      return;
    }

    const response = await fetch(item ? `/api/items/${item.id}` : "/api/items", {
      method: item ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checked.data),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      const message = data.error ?? "Could not save that item.";
      setError(message);
      notify("error", "Could not save", message);
      return;
    }

    notify("success", item ? "Item updated" : "Item added", checked.data.title);
    onOpenChange(false);
    router.refresh();
  }

  const categoryOptions = item && !categories.includes(item.category) ? [item.category, ...categories] : categories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 text-sm sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{item ? "Edit item" : "Add new item"}</DialogTitle>
          <DialogDescription>Title, author, and at least one copy are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <Field label="Title" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author" error={form.formState.errors.author?.message}>
              <Input {...form.register("author")} />
            </Field>
            <Field label="Category" error={form.formState.errors.category?.message}>
              <select
                className="h-8 w-full rounded-xl border border-input bg-white px-2 text-sm outline-none focus-visible:border-ring"
                {...form.register("category")}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>New category</option>
              </select>
            </Field>
          </div>
          {selectedCategory === NEW_CATEGORY ? (
            <Field label="New category">
              <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ISBN" error={form.formState.errors.isbn?.message}>
              <Input className="font-mono" {...form.register("isbn")} />
            </Field>
            <Field label="Copies" error={form.formState.errors.totalCopies?.message}>
              <Input type="number" min={1} {...form.register("totalCopies", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Cover image URL">
            <Input {...form.register("coverImage")} />
          </Field>
          <Field label="Description">
            <textarea
              className="min-h-24 rounded-xl border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring"
              {...form.register("description")}
            />
          </Field>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" className="rounded-xl" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddItemButton({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" className="rounded-xl" onClick={() => setOpen(true)}>
        Add New Item
      </Button>
      {open ? <ItemFormModal open={open} onOpenChange={setOpen} categories={categories} /> : null}
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

function emptyValues(categories: string[]): ItemInput {
  return {
    title: "",
    author: "",
    isbn: "",
    category: categories[0] ?? NEW_CATEGORY,
    description: "",
    coverImage: "",
    totalCopies: 1,
  };
}

function valuesFromItem(item: EditableItem): ItemInput {
  return {
    title: item.title,
    author: item.author,
    isbn: item.isbn,
    category: item.category,
    description: item.description ?? "",
    coverImage: item.coverImage ?? "",
    totalCopies: item.totalCopies,
  };
}
