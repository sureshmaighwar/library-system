import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { apiError, readJson } from "@/lib/http";
import { LoanError, renewLoan } from "@/lib/loans";
import { renewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(401, "Sign in to renew a loan.");
    }

    const parsed = renewSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message ?? "Choose a loan to renew.");
    }

    const loan = await renewLoan(session.user.id, parsed.data.loanId);
    return NextResponse.json({ loan });
  } catch (error) {
    if (error instanceof LoanError) {
      return apiError(error.status, error.message);
    }
    console.error(error);
    return apiError(500, "Could not renew this loan.");
  }
}
