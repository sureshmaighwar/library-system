import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ItemSummary } from "@/types";

export function ItemCover({
  src,
  title,
  className,
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  if (src) {
    return <img src={src} alt="" className={cn("h-full w-full object-cover", className)} />;
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-amber-50 text-indigo-300",
        className,
      )}
      aria-hidden
    >
      <BookOpen className="size-10" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

function copyClass(availableCopies: number) {
  if (availableCopies <= 0) {
    return "text-red-500";
  }
  if (availableCopies <= 2) {
    return "text-amber-600";
  }
  return "text-emerald-600";
}

export function copyLabel(availableCopies: number, totalCopies: number) {
  if (availableCopies <= 0) {
    return "Unavailable";
  }
  return `${availableCopies} of ${totalCopies} copies available`;
}

export function ItemCard({ item }: { item: ItemSummary }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="h-40">
        <ItemCover src={item.coverImage} title={item.title} />
      </div>
      <div className="grid flex-1 gap-2 p-4">
        <Badge variant="secondary" className="w-fit">
          {item.category}
        </Badge>
        <h2 className="text-base font-semibold leading-snug group-hover:text-primary">{item.title}</h2>
        <p className="text-sm text-muted-foreground">{item.author}</p>
        <p className={cn("mt-auto text-sm font-medium", copyClass(item.availableCopies))}>
          {copyLabel(item.availableCopies, item.totalCopies)}
        </p>
      </div>
    </Link>
  );
}
