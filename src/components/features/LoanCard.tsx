import { Badge } from "@/components/ui/badge";
import { PayFineButton } from "@/components/features/PayFineButton";
import { RenewButton } from "@/components/features/RenewButton";
import { ReturnButton } from "@/components/features/ReturnButton";
import { formatFine, formatFineAmount } from "@/lib/fines";
import { cn, formatDate } from "@/lib/utils";
import type { LoanSummary } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function isOpen(status: LoanSummary["status"]) {
  return status === "ACTIVE" || status === "OVERDUE";
}

function loanTiming(loan: LoanSummary, now = new Date()) {
  const due = loan.dueDate.getTime();
  const start = loan.borrowedAt.getTime();
  const current = now.getTime();
  const overdue = isOpen(loan.status) && current > due;
  const daysOverdue = overdue ? Math.ceil((current - due) / DAY_MS) : 0;
  const daysLeft = Math.ceil((due - current) / DAY_MS);
  const span = Math.max(due - start, DAY_MS);
  const progress = overdue ? 100 : Math.min(100, Math.max(0, ((current - start) / span) * 100));
  const tone = overdue ? "overdue" : daysLeft <= 3 ? "soon" : "ok";
  return { overdue, daysOverdue, daysLeft, progress, tone };
}

export function LoanCard({
  loan,
  canReturn = false,
  canRenew = false,
  canMarkPaid = false,
  hasReservation = false,
  estimatedFineCents,
}: {
  loan: LoanSummary;
  canReturn?: boolean;
  canRenew?: boolean;
  canMarkPaid?: boolean;
  hasReservation?: boolean;
  estimatedFineCents?: number;
}) {
  const open = isOpen(loan.status);
  const timing = open ? loanTiming(loan) : null;
  const renewDisabled = loan.renewed || Boolean(timing?.overdue) || hasReservation;
  const fineLabel =
    loan.status === "RETURNED" ? formatFineAmount(loan.fineAmount) : formatFine(estimatedFineCents ?? 0);
  const barClass =
    timing?.tone === "overdue" ? "bg-red-500" : timing?.tone === "soon" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        timing?.overdue ? "border-red-400" : "border-[#e5e7eb]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-base font-semibold">{loan.item.title}</h2>
          <p className="text-sm text-muted-foreground">{loan.item.author}</p>
        </div>
        <Badge variant={timing?.overdue ? "destructive" : loan.status === "RETURNED" ? "secondary" : "default"}>
          {timing?.overdue ? "OVERDUE" : loan.status === "ACTIVE" ? "On time" : "Returned"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <p>Borrowed {formatDate(loan.borrowedAt)}</p>
        <p>Due {formatDate(loan.dueDate)}</p>
        {loan.returnedAt ? <p>Returned {formatDate(loan.returnedAt)}</p> : null}
        {timing?.overdue ? (
          <p className="font-medium text-red-600">
            {timing.daysOverdue} {timing.daysOverdue === 1 ? "day" : "days"} overdue · Fine {fineLabel}
          </p>
        ) : open ? (
          <p className={timing?.tone === "soon" ? "text-amber-600" : "text-emerald-600"}>
            {Math.max(timing?.daysLeft ?? 0, 0)} days left · Fine {fineLabel}
          </p>
        ) : (
          <p>{loan.finePaid ? "Fine paid" : "Fine unpaid"} · {fineLabel}</p>
        )}
        {loan.user ? <p className="text-muted-foreground">{loan.user.name}</p> : null}
      </div>
      {timing ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", barClass)}
            style={{ width: `${timing.progress}%` }}
          />
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        {canReturn && open ? <ReturnButton loanId={loan.id} /> : null}
        {canRenew ? <RenewButton loanId={loan.id} disabled={renewDisabled} /> : null}
        {canMarkPaid && loan.status === "RETURNED" && !loan.finePaid ? <PayFineButton loanId={loan.id} /> : null}
      </div>
    </div>
  );
}
