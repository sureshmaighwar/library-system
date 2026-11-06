"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { itemSchema, type ItemInput } from "@/lib/validations";

export function ItemForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      category: "",
      description: "",
      coverImage: "",
      totalCopies: 1,
    },
  });

  async function onSubmit(values: ItemInput) {
    setError(null);
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Could not add that item.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" {...form.register("author")} />
          {form.formState.errors.author ? (
            <p className="text-sm text-red-500">{form.formState.errors.author.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...form.register("category")} />
          {form.formState.errors.category ? (
            <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input id="isbn" className="font-mono" {...form.register("isbn")} />
          {form.formState.errors.isbn ? (
            <p className="text-sm text-red-500">{form.formState.errors.isbn.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="coverImage">Cover image URL</Label>
          <Input id="coverImage" {...form.register("coverImage")} />
        </div>
      </div>
      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor="totalCopies">Copies</Label>
        <Input id="totalCopies" type="number" min={1} {...form.register("totalCopies", { valueAsNumber: true })} />
        {form.formState.errors.totalCopies ? (
          <p className="text-sm text-red-500">{form.formState.errors.totalCopies.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="min-h-24 rounded-xl border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...form.register("description")}
        />
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Adding…" : "Add item"}
      </Button>
    </form>
  );
}
