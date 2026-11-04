import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PayFineButton } from "@/components/features/PayFineButton";
import { ReturnButton } from "@/components/features/ReturnButton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateFineCents, formatFine, formatFineAmount } from "@/lib/fines";
import { markOverdueLoans } from "@/lib/loans";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Loans" };

export default function LibrarianLoansPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading loans…</p>}>
      <LoansDesk />
    </Suspense>
  );
}

async function LoansDesk() {
  await connection();
  const { prisma } = await import("@/lib/prisma");
  await markOverdueLoans(prisma);
  const loans = await prisma.loan.findMany({
    include: {
      item: { select: { id: true, title: true, author: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { borrowedAt: "desc" },
  });
  const now = new Date();

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="text-sm text-muted-foreground">Every borrow and return, newest first.</p>
      </div>
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        {loans.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">No loans yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => {
                const open = loan.status === "ACTIVE" || loan.status === "OVERDUE";
                const fine = loan.status === "RETURNED" ? formatFineAmount(loan.fineAmount) : formatFine(calculateFineCents(loan.dueDate, now));
                return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="grid">
                        <span>{loan.user.name}</span>
                        <span className="text-xs text-muted-foreground">{loan.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{loan.item.title}</TableCell>
                    <TableCell>{formatDate(loan.dueDate)}</TableCell>
                    <TableCell>{fine}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "OVERDUE" ? "destructive" : loan.status === "ACTIVE" ? "default" : "secondary"}>
                        {loan.status === "OVERDUE" ? "Overdue" : loan.status === "ACTIVE" ? "Active" : "Returned"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {open ? <ReturnButton loanId={loan.id} /> : null}
                      {loan.status === "RETURNED" && !loan.finePaid ? <PayFineButton loanId={loan.id} /> : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
