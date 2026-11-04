import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { ItemForm } from "@/components/features/ItemForm";
import { StockButtons } from "@/components/features/StockButtons";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listItems } from "@/lib/items";

export const metadata: Metadata = { title: "Items" };

export default function LibrarianItemsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading items…</p>}>
      <ItemsDesk />
    </Suspense>
  );
}

async function ItemsDesk() {
  await connection();
  const items = await listItems();

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Items</h1>
        <p className="text-sm text-muted-foreground">Add a title and set how many copies the shelf holds.</p>
      </div>
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <ItemForm />
      </div>
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        {items.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.author}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.availableCopies > 0 ? "secondary" : "destructive"}
                      className={
                        item.availableCopies > 0 && item.availableCopies <= item.lowStockThreshold
                          ? "bg-amber-100 text-amber-800"
                          : undefined
                      }
                    >
                      {item.availableCopies}/{item.totalCopies}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StockButtons itemId={item.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
