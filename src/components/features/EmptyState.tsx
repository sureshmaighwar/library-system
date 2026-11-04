import Link from "next/link";
import { AlertTriangle, BookOpen, Library, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyVariant = "no-results" | "no-loans" | "no-items" | "error";

const presets: Record<EmptyVariant, { title: string; description: string; icon: typeof Search }> = {
  "no-results": {
    title: "No matches",
    description: "Try another search, or clear the filters.",
    icon: Search,
  },
  "no-loans": {
    title: "No loans here",
    description: "Borrowed books will show up in this list.",
    icon: BookOpen,
  },
  "no-items": {
    title: "No items match",
    description: "Try another title, author, or category.",
    icon: Library,
  },
  error: {
    title: "Something went wrong",
    description: "The page could not be loaded. Try again in a moment.",
    icon: AlertTriangle,
  },
};

export function EmptyState({
  variant,
  title,
  description,
  href,
  actionLabel,
  onRetry,
}: {
  variant: EmptyVariant;
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  const preset = presets[variant];
  const Icon = preset.icon;

  return (
    <div className="grid justify-items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-sm">
      <Icon className="size-12 text-indigo-300" />
      <p className="text-lg font-medium">{title ?? preset.title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description ?? preset.description}</p>
      {href && actionLabel ? (
        <Link href={href} className={cn(buttonVariants(), "rounded-xl")}>
          {actionLabel}
        </Link>
      ) : null}
      {onRetry ? (
        <button type="button" className={cn(buttonVariants(), "rounded-xl")} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
