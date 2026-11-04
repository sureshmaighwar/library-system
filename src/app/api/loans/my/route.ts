import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { calculateFineCents, centsToAmount } from "@/lib/fines";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to view your loans.");
    }

    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const loans = await prisma.loan.findMany({
      where: { userId: session.user.id },
      include: {
        item: { select: { id: true, title: true, author: true } },
      },
      orderBy: { borrowedAt: "desc" },
    });

    return NextResponse.json({
      loans: loans.map((loan) => {
        const returned = loan.status === "RETURNED" || loan.returnedAt !== null;
        const overdue = !returned && now.getTime() > loan.dueDate.getTime();
        const currentFine = returned
          ? loan.fineAmount.toString()
          : centsToAmount(calculateFineCents(loan.dueDate, now));
        return {
          ...loan,
          fineAmount: loan.fineAmount.toString(),
          overdue,
          currentFine,
        };
      }),
    });
  } catch (error) {
    console.error(error);
    return apiError(500, "Could not load your loans.");
  }
}
