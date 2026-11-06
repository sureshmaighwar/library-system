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
  const edgeClass =
    timing?.tone === "overdue" || loan.status === "OVERDUE"
      ? "border-l-red-500"
      : timing?.tone === "soon"
        ? "border-l-amber-500"
        : loan.status === "RETURNED"
          ? "border-l-slate-300"
          : "border-l-emerald-500";
  const statusLabel = timing?.overdue ? "Overdue" : loan.status === "ACTIVE" ? "On time" : "Returned";

  return (
    <div className={cn("flex flex-col gap-4 rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm sm:flex-row sm:items-center", edgeClass)}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">{loan.item.title}</h2>
          <Badge variant={timing?.overdue ? "destructive" : loan.status === "RETURNED" ? "secondary" : "default"}>{statusLabel}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">{loan.item.author}</p>
        <p className="mt-2 text-sm text-slate-600">
          Borrowed {formatDate(loan.borrowedAt)} · Due {formatDate(loan.dueDate)}
          {loan.returnedAt ? ` · Returned ${formatDate(loan.returnedAt)}` : ""}
        </p>
        {timing?.overdue ? (
          <p className="mt-1 text-sm font-medium text-red-600">
            {timing.daysOverdue} {timing.daysOverdue === 1 ? "day" : "days"} overdue · Fine {fineLabel}
          </p>
        ) : open ? (
          <p className={cn("mt-1 text-sm font-medium", timing?.tone === "soon" ? "text-amber-600" : "text-emerald-600")}>
            {Math.max(timing?.daysLeft ?? 0, 0)} days left · Fine {fineLabel}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            {loan.finePaid ? "Fine paid" : "Fine unpaid"} · {fineLabel}
          </p>
        )}
        {loan.user ? <p className="mt-1 text-sm text-slate-500">{loan.user.name}</p> : null}
      </div>
      <div className="grid w-full gap-2 sm:w-40">
        {canReturn && open ? <ReturnButton loanId={loan.id} /> : null}
        {canRenew ? <RenewButton loanId={loan.id} disabled={renewDisabled} /> : null}
        {canMarkPaid && loan.status === "RETURNED" && !loan.finePaid ? <PayFineButton loanId={loan.id} /> : null}
      </div>
    </div>
  );
}
