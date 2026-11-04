"use client";

import { EmptyState } from "@/components/features/EmptyState";

export default function LibrarianError({ reset }: { error: Error; reset: () => void }) {
  return <EmptyState variant="error" onRetry={reset} />;
}
