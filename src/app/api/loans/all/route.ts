import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { listLibrarianLoans, type LoanListStatus } from "@/lib/librarian-loans";

const STATUSES = new Set<LoanListStatus>(["all", "active", "returned", "overdue"]);

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to view loans.");
    }
    if (session.user.role !== "LIBRARIAN") {
      return apiError(403, "Librarian access is required.");
    }

    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status") ?? "all";
    const status: LoanListStatus = STATUSES.has(rawStatus as LoanListStatus) ? (rawStatus as LoanListStatus) : "all";
    const search = (url.searchParams.get("search") ?? "").trim().slice(0, 200);
    const loans = await listLibrarianLoans({ status, search });
    return NextResponse.json({ loans });
  } catch (error) {
    console.error(error);
    return apiError(500, "Could not load loans.");
  }
}
