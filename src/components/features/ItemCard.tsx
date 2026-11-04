import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItemSummary } from "@/types";

export function ItemCard({ item }: { item: ItemSummary }) {
  const available = item.availableCopies > 0;
  const low = available && item.availableCopies <= item.lowStockThreshold;

  return (
    <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm ring-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>
            <Link href={`/items/${item.id}`} className="hover:text-primary">
              {item.title}
            </Link>
          </CardTitle>
          <Badge
            variant={available ? "secondary" : "destructive"}
            className={low ? "bg-amber-100 text-amber-800" : undefined}
          >
            {available ? `${item.availableCopies} available` : "Unavailable"}
            {low ? " · low" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1 text-sm text-muted-foreground">
        <p>{item.author}</p>
        <p>{item.category}</p>
      </CardContent>
    </Card>
  );
}
