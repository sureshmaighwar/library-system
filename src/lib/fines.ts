const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Fine rate required by R-18. Stored as cents so currency math stays integer. */
export const FINE_CENTS_PER_DAY = 50;

export const LOAN_PERIOD_DAYS = 14;

/**
 * Overdue fine from the due date and the actual return time.
 * A partial day past the due date counts as one day. On-time returns are $0.00.
 */
export function calculateFineCents(dueAt: Date, returnedAt: Date): number {
  const overdueMs = returnedAt.getTime() - dueAt.getTime();
  if (overdueMs <= 0) {
    return 0;
  }

  const overdueDays = Math.ceil(overdueMs / MS_PER_DAY);
  return overdueDays * FINE_CENTS_PER_DAY;
}

export function formatFine(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Dollar string for Prisma Decimal columns, derived from integer cents. */
export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatFineAmount(amount: { toString(): string } | number | string): string {
  const value = typeof amount === "number" ? amount : Number(amount.toString());
  return `$${value.toFixed(2)}`;
}

export function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}
