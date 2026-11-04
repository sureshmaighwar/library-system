import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayFineButton } from "@/components/features/PayFineButton";
import { RenewButton } from "@/components/features/RenewButton";
import { ReturnButton } from "@/components/features/ReturnButton";
import { formatFine, formatFineAmount } from "@/lib/fines";
import { formatDate } from "@/lib/utils";
import type { LoanSummary } from "@/types";

function isOpen(status: LoanSummary["status"]) {
  return status === "ACTIVE" || status === "OVERDUE";
}

export function LoanCard({
  loan,
  canReturn = false,
  canRenew = false,
  canMarkPaid = false,
  estimatedFineCents,
}: {
  loan: LoanSummary;
  canReturn?: boolean;
  canRenew?: boolean;
  canMarkPaid?: boolean;
  estimatedFineCents?: number;
}) {
  const fineLabel =
    loan.status === "RETURNED" ? formatFineAmount(loan.fineAmount) : formatFine(estimatedFineCents ?? 0);

  return (
    <Card className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm ring-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{loan.item.title}</CardTitle>
          <Badge variant={loan.status === "OVERDUE" ? "destructive" : loan.status === "ACTIVE" ? "default" : "secondary"}>
            {loan.status === "OVERDUE" ? "Overdue" : loan.status === "ACTIVE" ? "Active" : "Returned"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <p className="text-muted-foreground">{loan.item.author}</p>
        <p>Borrowed {formatDate(loan.borrowedAt)}</p>
        <p>Due {formatDate(loan.dueDate)}</p>
        {loan.returnedAt ? <p>Returned {formatDate(loan.returnedAt)}</p> : null}
        <p>
          Fine {fineLabel}
          {loan.status === "RETURNED" && loan.finePaid ? " · paid" : ""}
          {loan.status === "RETURNED" && !loan.finePaid ? " · unpaid" : ""}
        </p>
        {loan.renewed && isOpen(loan.status) ? <p className="text-muted-foreground">Renewed once</p> : null}
        {loan.user ? <p className="text-muted-foreground">{loan.user.name}</p> : null}
        {canReturn && isOpen(loan.status) ? <ReturnButton loanId={loan.id} /> : null}
        {canRenew && loan.status === "ACTIVE" && !loan.renewed ? <RenewButton loanId={loan.id} /> : null}
        {canMarkPaid && loan.status === "RETURNED" && !loan.finePaid ? <PayFineButton loanId={loan.id} /> : null}
      </CardContent>
    </Card>
  );
}
