import Link from "next/link";
import { BookOpen } from "lucide-react";

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

function availabilityPill(availableCopies: number) {
  if (availableCopies <= 0) {
    return "bg-red-50 text-red-600";
  }
  if (availableCopies <= 2) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-emerald-50 text-emerald-700";
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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="h-[220px] overflow-hidden">
        <ItemCover src={item.coverImage} title={item.title} className="transition-transform duration-200 ease-out group-hover:scale-105" />
      </div>
      <div className="grid flex-1 gap-2 p-4">
        <h2 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-indigo-600">{item.title}</h2>
        <p className="text-sm text-slate-500">{item.author}</p>
        <span className={cn("mt-auto w-fit rounded-full px-2.5 py-1 text-xs font-medium", availabilityPill(item.availableCopies))}>
          {copyLabel(item.availableCopies, item.totalCopies)}
        </span>
      </div>
    </Link>
  );
}
